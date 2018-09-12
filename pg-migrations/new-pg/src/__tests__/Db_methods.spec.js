/**
 * @flow
 */

const { Db, Table } = require('../')
const path = require('path')

const randomNum = Math.floor(Math.random() * 1000)
const SQLPATH = path.join(__dirname, 'sql')
const OPTIONS = {
  schemaBase: `db_method_tests_${randomNum}`,
  schemaVersion: 0.4,
  sqlDirectory: SQLPATH
}

const db = new Db(OPTIONS)
beforeAll(async () => {
  await db.sync()
})
afterAll(async () => {
  await db.close()
})

describe('Db methods', () => {
  test('getTable() it can get a table', () => {
    const table = db.getTable('test')
    expect(table).toBeInstanceOf(Table)
  })

  test('getTableNames() it can get table names', async () => {
    const tableNames = await db.getTableNames()
    expect(tableNames).toEqual(expect.arrayContaining(['test']))
  })

  test('query() it can query data', async () => {
    const { rows } = await db.query(`select * from test limit 1`)
    expect(rows).toMatchSnapshot()
  })

  test('find() it can find data', async () => {
    const rows = await db.find(`select * from test limit 1`)
    expect(rows[0].id).toBeDefined()
    expect(rows).toMatchSnapshot()
  })

  test('one() it can get one row of data', async () => {
    const row = await db.one(`select * from test limit 1`)
    expect(row.id).toBeDefined()
    expect(row).toMatchSnapshot()
  })
})
