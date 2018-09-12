/**
 * @flow
 * A Utility for testing if migration files are written correctly
 */

const Db = require('./Db')
const PsqlWrapper = require('./PsqlWrapper')
const SQL = require('sql-template-strings')

type MigrationTestVariables = {
  sqlDirectory: string,
  originalVersion: number,
  targetVersion: number,
  originalSchemaBase?: string,
  targetSchemaBase?: string
}

class MigrationTester {
  params: MigrationTestVariables
  isInitialized: Promise<boolean>
  originalDb: Db
  targetDb: Db
  originalPsql: PsqlWrapper
  targetPsql: PsqlWrapper

  constructor (params: MigrationTestVariables) {
    this.params = params
    this.isInitialized = this.initialize()
  }

  async initialize () {
    const randomNum = Math.floor(Math.random() * 10000)
    this.originalDb = new Db({
      sqlDirectory: this.params.sqlDirectory,
      overrideEnv: true,
      schemaBase: this.params.originalSchemaBase || `test-migrations-original-${randomNum}`,
      schemaVersion: this.params.originalVersion
    })
    this.targetDb = new Db({
      sqlDirectory: this.params.sqlDirectory,
      overrideEnv: true,
      schemaBase: this.params.targetSchemaBase || `test-migrations-target-${randomNum}`,
      schemaVersion: this.params.targetVersion
    })
    try {
      await Promise.all([this.originalDb.sync(), this.targetDb.sync()])
      await this.originalDb.migrateTo(this.params.targetVersion)
    } catch (err) {
      await this.closeDb()
      throw err
    }
    return true
  }

  async closeDb () {
    await Promise.all([
      this.originalDb.close(),
      this.targetDb.close()
    ])
  }
  async initializePsql () {
    this.originalPsql = new PsqlWrapper(this.originalDb)
    this.targetPsql = new PsqlWrapper(this.targetDb)
  }

  async closePsql () {
    await Promise.all([
      this.originalPsql.close(),
      this.targetPsql.close()
    ])
  }

  async test (expect: Function) {
    await this.isInitialized
    try {
      await this.initializePsql()
      await this._test(expect)
    } finally {
      await this.closePsql()
      await this.closeDb()
    }
  }

  async _test (expect: Function) {
    // first compare tables
    const tables = await this.getTablesInTarget()
    for (const table of tables) {
      const original = await this.originalPsql.describeTable(table)
      const target = await this.targetPsql.describeTable(table)
      expect(original.split('\n').sort()).toEqual(target.split('\n').sort())
      expect(original).toMatchSnapshot(`DB v${this.originalDb.schemaVersion}, table: ${table}`)
    }

    // now compare enums
    const originalTypes = await this.originalPsql.describeUserTypes()
    const targetTypes = await this.targetPsql.describeUserTypes()
    expect(originalTypes).toEqual(targetTypes)
    expect(originalTypes).toMatchSnapshot(`DB v${this.targetDb.schemaVersion}, custom types`)
  }

  async getTablesInTarget (): Promise<Array<string>> {
    const { rows } = await this.targetDb.query(SQL`
      select table_name
      from information_schema.tables
      where table_schema = ${this.targetDb.schemaName}
    `)
    // $FlowFixMe cheap type cast
    return rows.map(row => row.tableName)
  }
}

module.exports = MigrationTester
