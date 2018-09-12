/**
 * @flow
 */

const { Keyset, Db } = require('../')
const path = require('path')
const pgFormat = require('pg-format')

const OPTIONS = {
  schemaBase: 'tabletests',
  schemaVersion: 1.0,
  overrideEnv: true,
  sqlDirectory: path.join(__dirname, 'sql')
}

const db = new Db(OPTIONS)
beforeAll(async () => {
  await db.sync()
})

afterAll(async () => {
  await db.close()
})

describe('Table', () => {
  test('can get column names from a table', async () => {
    const table = db.getTable('test')
    const columns = await table.getColumns()
    expect(columns.map(col => col.columnName)).toEqual(expect.arrayContaining(['id', 'tags']))
  }, 6000)

  test('can get a keyset from a table', () => {
    const table = db.getTable('test')
    const keyset = table.getKeyset()
    expect(keyset).toBeInstanceOf(Keyset)
  }, 6000)

  test('__safeColumns only returns columns specified in the table', async () => {
    const table = db.getTable('test')
    const columns = await table.__safeColumns(['tags', 'doesntexist', 'testName'])
    expect(columns.map(col => col.camelName)).toEqual(expect.arrayContaining(['tags', 'testName']))
    expect(columns.map(col => col.columnName)).toEqual(expect.arrayContaining(['tags', 'test_name']))
  })

  test('__insertSql generates sensible sql', async () => {
    const table = db.getTable('test')
    const columns = await table.__safeColumns(['tags', 'doesntexist'])
    const sql = table.__insertSql({tags: ['a-tag']}, columns)
    expect(sql).toMatchSnapshot()
  })

  test('__updateSql generates sensible sql', async () => {
    const table = db.getTable('test')
    const columns = await table.__safeColumns(['tags', 'doesntexist'])
    const sql = table.__updateSql({id: 1, tags: ['a-tag']}, columns)
    expect(sql).toMatchSnapshot()
  })

  test('insert() can insert a value into table', async () => {
    const table = db.getTable('test')
    const tags = ['a-tag']
    const record = await table.insert({tags})
    const result = await db.query(pgFormat('select * from test where id = %L', record.id))
    expect(result.rowCount).toBe(1)
    expect(record.id).toBeDefined()
    expect(record.tags).toEqual(tags)
  })

  test('update () can update an existing value in the table', async () => {
    const table = db.getTable('test')
    const tags = ['different-tag']
    const testName = 'differentName'
    const originalRecord = await table.insert({tags: ['test-tag'], testName: 'notTheSame'})
    const updatedRecord = await table.update({...originalRecord, tags, testName})
    expect(updatedRecord.id).toBe(originalRecord.id)
    expect(updatedRecord.tags).toEqual(tags)
    expect(updatedRecord.testName).toEqual(testName)
  })

  test('upsert() can udpates row if row already exists (by id)', async () => {
    const table = db.getTable('test')
    const tags = ['different-tag-b']
    const testName = 'newName'
    const originalRecord = await table.insert({tags: ['test-tag-2'], testName: 'notthesameasBefore'})
    const updatedRecord = await table.upsert({...originalRecord, tags, testName})
    const newRecord = await table.upsert({tags, testName})
    expect(updatedRecord.id).toBe(originalRecord.id)
    expect(updatedRecord.tags).toEqual(tags)
    expect(updatedRecord.testName).toEqual(testName)
    expect(newRecord.tags).toEqual(tags)
    expect(newRecord.testName).toEqual(testName)
    delete newRecord.id
    delete updatedRecord.id
    expect(newRecord).toEqual(updatedRecord)
  })
})
