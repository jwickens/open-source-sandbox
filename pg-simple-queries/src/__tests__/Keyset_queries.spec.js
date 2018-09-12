/**
 * @flow
 */
const { Db } = require('../')
const path = require('path')

const OPTIONS = {
  schemaBase: 'keysetquerytests',
  schemaVersion: 0.3,
  overrideEnv: true,
  sqlDirectory: path.join(__dirname, 'sql')
}

const db = new Db(OPTIONS)
let table
beforeAll(async () => {
  await db.sync()
  await db.migrateTo(1)
  table = db.getTable('test')
})

afterAll(async () => {
  await db.close()
})

describe('Keyset', () => {
  test('can get a paginated list (basic)', async () => {
    const keyset = table.getKeyset()
      .select(['id', 'tags', 'message'])
      .start({field: 'id', first: 1})
    const result = await keyset.query()
    expect(result).toMatchSnapshot()
    const plan = await db.query(`explain ${keyset.toSql()}`)
    expect(keyset.toSql()).toMatchSnapshot()
    expect(plan.rows.map(r => r['QUERY PLAN']).join('\n')).toMatchSnapshot()
  })

  test.skip('can get a paginated list (search)', async () => {
    const keyset = table.getKeyset()
      .select(['id', 'tags', 'message'])
      .start({field: 'message', searchQuery: 'hell', first: 1})

    const result = await keyset.query()
    expect(result.edges[0].node.message).toMatch('hell')
    expect(result).toMatchSnapshot()
    const plan = await db.query(`explain ${keyset.toSql()}`)
    expect(keyset.toSql()).toMatchSnapshot()
    expect(plan.rows.map(r => r['QUERY PLAN']).join('\n')).toMatchSnapshot()
  })

  test('can start from the end', async () => {
    const keyset = table.getKeyset()
      .select(['id', 'tags', 'message'])
      .start({field: 'id', last: 10})
    const result = await keyset.query()
    expect(result.pageInfo).toEqual({hasNextPage: true, hasPrevPage: false, totalCount: 463})
    expect(result).toMatchSnapshot()
    const plan = await db.query(`explain ${keyset.toSql()}`)
    expect(keyset.toSql()).toMatchSnapshot()
    expect(plan.rows.map(r => r['QUERY PLAN']).join('\n')).toMatchSnapshot()
  })

  test('can use default last option', async () => {
    const keyset = table.getKeyset()
      .select(['id', 'tags', 'message'])
      .start({field: 'id', defaultLast: true})
    const result = await keyset.query()
    expect(result.pageInfo).toEqual({hasNextPage: true, hasPrevPage: false, totalCount: 463})
    expect(result).toMatchSnapshot()
    const plan = await db.query(`explain ${keyset.toSql()}`)
    expect(keyset.toSql()).toMatchSnapshot()
    expect(plan.rows.map(r => r['QUERY PLAN']).join('\n')).toMatchSnapshot()
  })
})
