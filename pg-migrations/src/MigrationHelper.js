/**
 * @flow
 */

import type { SqlFile, SqlFileType, AnnotatedSqlFile, MigrationsInfo } from './MigrationHelper.types.js'
import type Db from './Db'

const fs = require('fs')
const glob = require('glob')
const path = require('path')
const pgFormat = require('pg-format')
const MIGRATION_SUCESS = 'sucessfully migrated'
const MIGRATION_FAILURE = 'failed to migrate'
const NODE_ENV = ((process.env.NODE_ENV: any): string)

const onlyFilesOfType = (type: SqlFileType) => (files: AnnotatedSqlFile[]) => files.filter(f => f.type === type)

class MigrationHelper {
  db: Db
  query: *
  transact: *
  schemaVersion: number
  sqlDirectory: string
  schemaBase: string
  remoteVersion: ?number
  logger: *
  isInitialized: Promise<boolean>
  migrationFiles: MigrationsInfo[]

  constructor (db: Db) {
    this.db = db
    this.query = this.db.query.bind(db)
    this.transact = this.db.transact.bind(db)
    this.schemaVersion = this.db.schemaVersion
    this.schemaBase = this.db.schemaBase
    this.sqlDirectory = this.db.sqlDirectory
    this.logger = this.db.logger
    this.isInitialized = this.__initialize()
  }

  async __initialize () {
    const sqlFiles = await this.__getAnnotatedSqlFiles()
    this.migrationFiles = await this.__createMigrationsInfo(sqlFiles)
    return true
  }

  async versionUp () {
    await this.isInitialized
    await this.__awaitMigrationEnd()
    this.logger.debug('other migrations done')
    const dbVersion = await this.__getVersionFromRemoteDb()
    if (typeof dbVersion !== 'number') {
      await this.__setUpNewDb()
    } else if (dbVersion < this.schemaVersion) {
      await this.__versionRemoteDbUpToSchemaVersion(dbVersion)
    } else if (dbVersion === this.schemaVersion) {
      this.logger.info(`db version is already ${dbVersion}`)
    } else {
      throw new Error(`App db version ${this.schemaVersion} too low for installed db version ${dbVersion}`)
    }
  }

  async __getVersionFromRemoteDb () {
    await this.db.versionTable.isInitialized
    return this.db.versionTable.getVersion()
  }

  async __setUpNewDb () {
    const migrationInfoForSchemaVersion = this.migrationFiles.find(m => m.version === this.schemaVersion)
    if (!migrationInfoForSchemaVersion) throw new Error('No SQL files found')
    const filesToApply = [...migrationInfoForSchemaVersion.idempotents, ...migrationInfoForSchemaVersion.snapshots]
    const continueMigration = await this.__startMigration()
    if (!continueMigration) {
      this.logger.debug(`setting up db version ${this.schemaVersion} already taking place`)
      return
    }
    try {
      await this.__versionCommit(filesToApply)
      await this.__markMigrationEnd(true)
    } catch (err) {
      await this.__markMigrationEnd(false)
      throw err
    }
    this.logger.info(`db ${this.schemaVersion} setup for the first time`)
  }

  async __versionRemoteDbUpToSchemaVersion (remoteCurrentVersion: number) {
    const continueMigration = await this.__startMigration()
    if (!continueMigration) {
      this.logger.debug(`db migration to version ${remoteCurrentVersion} already taking place`)
      return
    }
    try {
      await this.__applyVersions(remoteCurrentVersion)
      await this.__markMigrationEnd(true)
    } catch (err) {
      await this.__markMigrationEnd(false)
      throw err
    }
    this.logger.info(`migration from ${remoteCurrentVersion} to ${this.schemaVersion} done`)
  }

  async __awaitMigrationEnd (tryCount: number = 0) {
    this.logger.debug(`trying to get migrations info (try: ${tryCount})`)
    // first check if the DB has a record of a migration in progress
    const { rows, rowCount } = await this.query(`
      select version, deploy_start from version where deployed_ts is null and version is not null order by deploy_start desc
    `)
    // if no migrations in progress then we can continue
    if (rowCount === 0) {
      return
    }
    this.logger && this.logger.info(`migrations possibly in progress: ${JSON.stringify(rows)}`)
    // otherwise wait for a postgres notify message
    const migrationEnded = new Promise((resolve, reject) => {
      this.db.on('schema_notification', (payload) => {
        /* istanbul ignore else */
        if (payload === MIGRATION_SUCESS) {
          resolve(true)
        } else if (payload === MIGRATION_FAILURE) {
          reject(new Error(`another migration recently failed, aborting`))
        }
      })
      setTimeout(() => reject(new Error('timed out')), 1000)
    })
    try {
      await migrationEnded
    } catch (err) {
      if (tryCount < 10) {
        const newTrycount = tryCount + 1
        this.logger.debug(`failed trying to get migrations info (new try count: ${newTrycount})`)
        return this.__awaitMigrationEnd(newTrycount)
      } else {
        this.logger.error(`failed to wait for the migration to end: ${err.message}`)
      }
    }
  }

  async __startMigration () {
    try {
      await this.query({
        text: pgFormat(`insert into version (version) values (%L)`, this.schemaVersion),
        logError: false,
        logDebug: false
      })
      this.db.emit('migrate')
      return true
    } catch (err) {
      /* istanbul ignore else */
      if (err.constraint === 'version_version_key') {
        return false
      } else {
        this.logger.error(err)
        throw err
      }
    }
  }

  async __applyVersions (remoteCurrentVersion: number) {
    const migrationsInfo = await this.__getMigrationsForVersion(remoteCurrentVersion)
    for (const migration of migrationsInfo) {
      await this.__applyVersion(migration)
    }
  }

  async __applyVersion (migrationsInfo: MigrationsInfo) {
    const { preMigrations, idempotents: idempotentsOnly, postMigrations, snapshots } = migrationsInfo
    const idempotents = [...idempotentsOnly, ...snapshots]
    this.logger.verbose(`got migrations info for migration to ${migrationsInfo.version}:
      ${preMigrations.length} pre migrations: ${preMigrations.map(m => m.filename).join(', ')}
      ${idempotents.length} idempotents/snapshots: ${idempotents.map(m => m.filename).join(', ')}
      ${postMigrations.length} post migrations: ${postMigrations.map(m => m.filename).join(', ')}
    `)

    await this.__preVersion(preMigrations)
    await this.__versionCommit(idempotents)
    await this.__postVersion(postMigrations)
  }

  async __preVersion (preMigrations: AnnotatedSqlFile[]) {
    if (preMigrations.length > 0) {
      await this.__applyMigrations(preMigrations)
      this.logger.info(`applied pre migration scripts: ${preMigrations.map(f => f.baseName).join(', ')}`)
    }
  }

  async __versionCommit (idempotents: AnnotatedSqlFile[]) {
    if (idempotents.length > 0) {
      await this.__applyIdempotents(idempotents)
      this.logger.info(`applied idempotent scripts: ${idempotents.map(f => f.baseName).join(', ')}`)
    }
  }

  async __postVersion (postMigrations: AnnotatedSqlFile[]) {
    // todo make sure no old clients do not exist
    if (postMigrations.length > 0) {
      await this.__applyMigrations(postMigrations)
      this.logger.info(`applied post migration scripts: ${postMigrations.map(f => f.baseName).join(', ')}`)
    }
  }

  async __markMigrationEnd (success: boolean) {
    const client = await this.transact()
    try {
      if (success) {
        await client.query(pgFormat(`update version set deployed_ts = current_timestamp where version = %L`, this.schemaVersion))
      } else {
        await client.query(pgFormat(`delete from version where version = %L`, this.schemaVersion))
      }
      await client.query(pgFormat(`NOTIFY %I, %L`, this.schemaBase, success ? MIGRATION_SUCESS : MIGRATION_FAILURE))
      await client.query('commit')
    } catch (err) {
      /* istanbul ignore next */
      client.query('rollback')
      /* istanbul ignore next */
      throw err
    } finally {
      client.release()
    }
  }

  async __getAnnotatedSqlFiles (): Promise<AnnotatedSqlFile[]> {
    const sqlFiles: SqlFile[] = await this.__getSqlFiles(this.sqlDirectory)
    const versionRegex = /(.*)v([\d.]+.?[\d]*)(pre|post|snap)?\.sql$/
    const annotatedSqlFiles: AnnotatedSqlFile[] = sqlFiles.map(file => {
      const { filename, contents } = file
      const match = versionRegex.exec(filename)
      let baseName: string, version: ?number, type: SqlFileType
      if (match) {
        // eslint-disable-next-line no-unused-vars
        const [ m, matchedName, matchedVersion, matchedType ] = match
        baseName = matchedName.replace('.', '').split('/').pop()
        version = matchedVersion && parseFloat(matchedVersion)
        type = matchedType || 'pre'
      } else {
        baseName = file.filename.replace('.sql', '').split('/').pop()
        version = null
        type = 'idempotent'
      }
      return {
        filename,
        contents,
        baseName,
        version,
        type
      }
    })
    return annotatedSqlFiles
  }

  async __createMigrationsInfo (sqlFiles: AnnotatedSqlFile[]): Promise<MigrationsInfo[]> {
    const versionForIdempotents = this.schemaVersion
    const versions = sqlFiles.map(f => { return typeof f.version === 'number' ? f.version : versionForIdempotents })
    const versionSet: number[] = [...(new Set(versions))].sort()
    return versionSet.map(version => {
      const relevantFiles = sqlFiles.filter(file => {
        if (file.type === 'idempotent') {
          if (this.schemaVersion === version) {
            return !fileHasSnapAtVersion(file, version, sqlFiles)
          } else {
            return !fileHasSnapAtVersionOrBelow(file, version, sqlFiles) && fileIsMostRecent(file.baseName, version, version, sqlFiles)
          }
        } else if (file.type === 'snap') {
          // $FlowFixMe when file is type snap version exists
          return fileIsMostRecent(file.baseName, file.version, version, sqlFiles)
        } else {
          return file.version === version
        }
      })
      return {
        version,
        idempotents: onlyFilesOfType('idempotent')(relevantFiles),
        preMigrations: onlyFilesOfType('pre')(relevantFiles),
        postMigrations: onlyFilesOfType('post')(relevantFiles),
        snapshots: onlyFilesOfType('snap')(relevantFiles)
      }
    })
  }

  async __getMigrationsForVersion (currentVersion: number): Promise<MigrationsInfo[]> {
    return this.migrationFiles.filter(f => {
      const { version } = f
      const isAboveCurrentVersion = version > currentVersion
      const isBelowOrEqualToTargetVersion = version <= this.schemaVersion
      return isAboveCurrentVersion && isBelowOrEqualToTargetVersion
    })
  }

  async __readDir (directory: string) {
    const files: string[] = await (new Promise((resolve, reject) => {
      glob('**/*.sql', { cwd: directory }, (err, files) => {
        /* istanbul ignore next */
        err ? reject(err) : resolve(files)
      })
    }))
    return files
  }

  async __getSqlFiles (directory: string): Promise<Array<SqlFile>> {
    const sqlRegex = /^.*\.sql$/
    const files = await this.__readDir(directory)
    const allSql = files.filter(f => f.match(sqlRegex))

    return Promise.all(allSql.map(async filename => {
      const contents = await this.__readSql(path.join(directory, filename))
      return { filename, contents }
    }))
  }

  async __readSql (path: string) {
    const sql: string = await (new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, contents) => {
        /* istanbul ignore next */
        err ? reject(err) : resolve(contents)
      })
    }))
    return sql
  }

  async __applyIdempotents (sqlFiles: AnnotatedSqlFile[]) {
    for (const file of sqlFiles.sort(sortFiles)) {
      try {
        await this.query({ text: file.contents, logDebug: false, logError: false })
      } catch (err) {
        // if an idempotent throws an error because it already exists be silent
        // regardless don't roll back or stop, keep applying all scripts
        /* istanbul ignore if */
        if (!err.stack.match(/already exists/)) {
          this.logger.error(`unexpected error creating applying idempotent sql script ${file.filename}: ${err.stack}`)
        } else {
          if (NODE_ENV === 'production') {
            this.logger.warn(`idempotent sql script ${file.filename} threw an error, we assume its been already applied. you should fix this by using "create if not exists" clauses ect.`)
          } else {
            this.logger.warn(`idempotent sql script ${file.filename} threw an error: ${err.message}`)
          }
        }
      }
    }
  }

  async __applyMigrations (sqlFiles: AnnotatedSqlFile[]) {
    const client = await this.transact()
    for (const file of sqlFiles.sort(sortFiles)) {
      try {
        await client.query(file.contents)
      } catch (err) {
        // if we have an error while applying a migration we stop
        await client.query('rollback')
        client.release()
        this.logger.error(`unexpected error while performing migrations for version ${file.version || 'dev'} for sql script ${file.filename}: ${err.stack}`)
        throw err
      }
    }
    await client.query('commit')
    client.release()
  }
}

function sortFiles (a: AnnotatedSqlFile, b: AnnotatedSqlFile) {
  if (a.baseName > b.baseName) {
    return 1
  } else if (a.baseName < b.baseName) {
    return -1
  } else {
    return 0
  }
}

function fileHasSnapAtVersionOrBelow (fileToCheck: AnnotatedSqlFile, version: number, sqlFiles: AnnotatedSqlFile[]): boolean {
  if (!fileToCheck.type === 'idempotent') throw new Error('can only use this func for idepotents')
  // $FlowFixMe when file is a snap version exists
  const hasSnapshot = sqlFiles.find(f => f.type === 'snap' && f.version <= version && f.baseName === fileToCheck.baseName)
  return !!hasSnapshot
}

function fileHasSnapAtVersion (fileToCheck: AnnotatedSqlFile, version: number, sqlFiles: AnnotatedSqlFile[]): boolean {
  if (!fileToCheck.type === 'idempotent') throw new Error('can only use this func for idepotents')
  const hasSnapshot = sqlFiles.find(f => f.type === 'snap' && f.version === version && f.baseName === fileToCheck.baseName)
  return !!hasSnapshot
}

function fileIsMostRecent (baseName: string, fileVersion: number, targetVersion: number, sqlFiles: AnnotatedSqlFile[]) {
  if (fileVersion > targetVersion) return false
  const moreRecentFiles = sqlFiles.filter(f => {
    return (f.type === 'snap' || f.type === 'idempotent') && f.baseName === baseName
  }).find(f => {
    // for idempotent use targetVersion
    const thisVersion = f.version || targetVersion
    // $FlowFixMe when file is a snap version exists
    return thisVersion <= targetVersion && thisVersion > fileVersion
  })
  return !moreRecentFiles
}

module.exports = MigrationHelper
