/**
 * @flow
 */
import type { AppDbConstructorParams, Client, Logger, PoolInterface, QueryOptions, PoolClient, ResultSet, Row } from './Db.types.js'

const EventEmitter = require('events')
const pg = require('pg')
const pgCamelCaser = require('pg-camelcase')
pgCamelCaser.inject(pg)
const { Pool } = pg
const path = require('path')
const pgFormat = require('pg-format')
const getCallsites = require('callsites')
const readPkgUp = require('read-pkg-up')
const appDir = require('app-root-dir').get()
const { NODE_ENV, DEV, TEST, PROD } = require('./config')
const Table = require('./Table')
const { executeQueryWithTransactionOptional } = require('./util')
const { NoResultsFound } = require('./errors')
const MigrationHelper = require('./MigrationHelper')
const DbVersionTable = require('./DbVersionTable')

/**
 * Db provides schema constrained access to a postgres database as well as a sync script to bring the remote database up to spec with the application version.
 * @example
 * const { Db } = require('pg')
 * const path = require('path')
 *
 * // setup your DB, providing path to a SQL directory, it will be recursively searched for sql files
 * const db = new Db({sqlDirectory: path.join(__dirname, 'sql')})
 *
 * // perform any necessary migrations to bring the DB up to spec
 * await db.sync()
 *
 * // make a simple query with pure SQL
 * const { rows } = await db.query(`select columns from normal_sql_land`)
 * @param {AppDbConstructorParams} options
 * @param {AppDbConstructorParams} options.schemaVersion By default db-pg-objects uses the version in your applications package.json.
 * The patch version is not considered, only major and minor. If you want to override this pass in "schemaVersion" when initializing the DB instance.
 * @param {AppDbConstructorParams} options.sqlDirectory a directory where sql scripts will be searched (recursively) for.
 * by default db-pg-objects uses the version in your applications package.json.
 * @param {AppDbConstructorParams} options.schemaBase the "main" name for your schema, in production this will be the schema_name and in test and development suffixes
 * will be added to produce the full schema name
 */
class Db extends EventEmitter {
  schemaName: string
  logger: Logger
  pool: PoolInterface
  up: boolean
  sqlDirectory: string
  isInitialized: Promise<boolean>
  isReadyToSync: Promise<boolean>
  versionTable: DbVersionTable

  constructor ({
    logger,
    sqlDirectory = path.join(appDir, 'sql'),
    overrideEnv = false
  }: AppDbConstructorParams) {
    super()
    this.setMaxListeners(20)
    this.logger = logger
    this.sqlDirectory = sqlDirectory
    this.up = false
    this.schemaName = this.__getSchemaName({overrideEnv})
    this.isReadyToSync = this.__prepareToSync()
    this.__listenIsInitialized()
  }

  /**
   * produces a table instance for the given tablename.
   */
  getTable (tableName: string): Table {
    return new Table({db: this, tableName})
  }

  /**
   * Close the db. depending on the NODE_ENV this will either delete the schema or simply disconnect
   */
  async close (): Promise<void> {
    try {
      await this.isReadyToSync
    } finally {
      /* istanbul ignore else */
      if (DEV || TEST) {
        this.logger.info(`NODE_ENV is ${NODE_ENV}, deleting data from schema: ${this.schemaName}`)
        await this.__dbDestroy()
      } else {
        await this.__dbDisconnect()
      }
    }
  }

  /**
   * find all rows that match the query. Will throw an error if no match is found
   */
  async find (query: QueryOptions, client: ?PoolClient): Promise<Row[]> {
    await this.isInitialized
    const results = await executeQueryWithTransactionOptional(this, client, query)
    if (!results.rowCount) {
      throw new NoResultsFound('no rows returned', query)
    }
    return results.rows
  }

  /**
   * Returns a single row matching the query. An error is thrown if no results are found. Additional results are ignored.
   */
  async one (query: QueryOptions, client: ?PoolClient): Promise<Row> {
    const rows = await this.find(query, client)
    return rows[0]
  }

  /* istanbul ignore next */
  async __fatal (err: Error) {
    this.logger.error(`fatal error in pg-simple-queries: ${err.stack}`)
    throw err
  }

  /**
   * sync the db with your sql files, performing any migrations necessary.
   */
  async sync (): Promise<Db> {
    await this.isReadyToSync
    const helper = new MigrationHelper(this)
    await helper.isInitialized
    await helper.versionUp()
    this.logger.info('db version up to date')
    this.__up()
    return this
  }

  /**
   * Get all table names.
   */
  async getTableNames (client: Client = this.pool): Promise<string[]> {
    if (client === this.pool) {
      await this.isReadyToSync
    }
    const { rows } = await client.query(pgFormat(`
      select table_name from information_schema.tables
      where table_schema = %L
    `, this.schemaName))
    const tables = (rows.map(x => x && x.tableName): any[])
    return tables.filter(String)
  }

  /**
   * Get a client for performing a transaction. The transaction is already begun for you and
   * your commandsis are isolated to the schema name.
   * Remember to use client.query('rollback) on error and client.query('commit) on sucess.
   * Always use client.release(). See the node-pg docs at https://node-postgres.com/features/transactions
   */
  async transact (): Promise<PoolClient> {
    await this.isReadyToSync
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      // always scope queries by the schema; always use UTC as the timezone
      await client.query(pgFormat(`SET search_path TO %I, public; SET TIME ZONE 'utc'`, this.schemaName))
      // $FlowFixMe
      return client
    } catch (err) {
      /* istanbul ignore next */
      client.release()
      /* istanbul ignore next */
      throw err
    }
  }

  /**
   * Query the db. Your commands will be limited to the schema name for the Db instance.
   * Logging can be suppressed with the second optional param.
   */
  async query (query: QueryOptions, client: ?PoolClient): Promise<ResultSet> {
    await this.isReadyToSync
    let logDebug = true
    if (typeof query === 'string') {
      query = {text: query}
    } else {
      ({logDebug} = query)
    }
    const start = logDebug && Date.now()
    const results = await executeQueryWithTransactionOptional(this, client, query)
    // $FlowFixMe yes start must be defined
    const duration = logDebug && (Date.now() - start)
    // $FlowFixMe yes start must be defined
    logDebug && this.logger.debug(`executed query "${query.text.replace(/(\r\n|\n|\r|\s+)/gm, ' ').trim()}",\n${results.rowCount} rows in ${duration}ms`)
    return results
  }

  /**
   * migrate the remote db to a new version
   */
  async migrateTo (version: number) {
    this.schemaVersion = version
    await this.sync()
    return this
  }

  /**
   * get an array of strings describing functions
   */
  async getFunctions (): Promise<string[]> {
    await this.isReadyToSync
    const results: ResultSet = await this.query(pgFormat(`
      SELECT format('%%I(%%s)', p.proname, oidvectortypes(p.proargtypes)) as func
      FROM pg_proc p INNER JOIN pg_namespace ns ON (p.pronamespace = ns.oid)
      WHERE ns.nspname = %L
    `, this.schemaName))
    return results.rows
      .map(row => ((row['func']: any): string))
      .sort()
  }

  /**
   * get an description of thes schema. It is currently very limited to tables and
   * their columns with type, and functions.
   * For a fuller description see PsqlWrapper
   * TODO: iterively go through all of the views in information_schema
   */
  async describe (): Promise<{functions: string[], tables: {[string]: string[]}}> {
    await this.isReadyToSync
    const tables = await this.getTableNames()
    const columns = await Promise.all(tables.map(tablename => {
      const table = this.getTable(tablename)
      return table.getColumns({types: true})
    }))
    const description = {
      functions: await this.getFunctions(),
      tables: {}
    }
    tables.forEach((table, i) => {
      description.tables[table] = columns[i].sort()
    })
    return description
  }

  /**
   * The version from the version table
   * This is a confusingly named method and will likely be deprecated
   */
  async getVersion (): Promise<?number> {
    return this.versionTable.getVersion()
  }

  async __prepareToSync () {
    this.__poolUp()
    await this.__schemaListen()
    await this.__extensionsUp()
    await this.__schemaUp()
    this.versionTable = new DbVersionTable(this)
    await this.versionTable.isInitialized
    return true
  }

  __poolUp () {
    this.pool = new Pool()
    /* istanbul ignore next */
    this.pool.on('error', (err) => {
      this.__fatal(new Error(`the connection pool had an error: ${err}`))
    })
  }

  // provides a locking mechanism for trying to create schema
  async __schemaListen () {
    const client = new pg.Client()
    client.connect()
    client.query(pgFormat('LISTEN %I', this.schemaBase))
    client.on('notification', ({channel, payload}) => {
      /* istanbul ignore else */
      if (channel === this.schemaBase) {
        this.emit('schema_notification', payload)
      }
    })
    /* istanbul ignore next */
    client.on('error', async (err) => {
      // this is actually an expected error, we loop for a while on this
      this.logger.debug(`error while listening for schema notifications: ${err.stack}`)
      await this.__schemaListen()
      await client.end()
    })
  }

  __up () {
    this.up = true
    this.emit('up')
  }

  __down () {
    this.up = false
    this.emit('down')
  }

  __getSchemaName ({overrideEnv}: {overrideEnv: boolean}): string {
    if (PROD || overrideEnv) {
      return this.schemaBase
    } else {
      /* istanbul ignore else */
      if (TEST) {
        return `${this.schemaBase}${Math.floor((Math.random() * 1000))}`
      } else {
        return `${this.schemaBase}_development`
      }
    }
  }

  async __schemaUp () {
    try {
      // dont use the if not exists so we can log whether or not we created the schema
      await this.pool.query(pgFormat('CREATE SCHEMA %I', this.schemaName))
      this.logger.info(`created schema ${this.schemaName}`)
    } catch (err) {
      /* istanbul ignore if */
      if (!err.stack.match(/already exists|duplicate key value violates unique constrain/)) {
        this.__fatal((new Error(`Could not create schema ${this.schemaName}: ${err.stack}`)))
      } else {
        this.logger.info(`schema ${this.schemaName} already exists`)
      }
    }
  }

  async __extensionsUp () {
    try {
      await this.pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public`)
    } catch (err) {
      this.logger.error(`could not enable extensions: ${err}`)
    }
  }

  async __dbDisconnect () {
    await this.__down()
    await this.__poolDown()
  }

  async __dbDestroy () {
    await this.__down()
    await this.__schemaDown()
    await this.__poolDown()
  }

  async __poolDown () {
    if (this.pool) {
      await this.pool.end()
    }
  }

  async __schemaDown () {
    try {
      await this.pool.query(pgFormat(`DROP schema %I CASCADE`, this.schemaName))
    } catch (err) {
      /* istanbul ignore next */
      this.__fatal(new Error(`unable to bring schema down: ${err.stack}`))
    }
  }

  async __listenIsInitialized () {
    this.isInitialized = new Promise((resolve) => {
      this.on('up', () => resolve(true))
    })
  }
}

module.exports = Db
