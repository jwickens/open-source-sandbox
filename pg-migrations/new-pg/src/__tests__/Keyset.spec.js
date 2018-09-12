/**
 * @flow
 */

const { Db } = require('../')
const path = require('path')

const OPTIONS = {
  schemaBase: 'keysettests',
  schemaVersion: 1.0,
  overrideEnv: true,
  sqlDirectory: path.join(__dirname, 'sql')
}

const db = new Db(OPTIONS)
let table
beforeAll(async () => {
  await db.sync()
  table = db.getTable('test')
})

afterAll(async () => {
  await db.close()
})

describe('Keyset', () => {
  test('can add a seek to keyset', () => {
    const keyset = table.getKeyset().seek({field: 'id', value: 1})
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can seek before keyset', () => {
    const keyset = table.getKeyset().seek({field: 'id', value: 1}).before()
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can add a seek with desc sort', () => {
    const keyset = table.getKeyset().seek({field: 'id', value: 1, desc: true}).after()
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can add a filter in to keyset', () => {
    const keyset = table.getKeyset().in({field: 'id', values: [1, 2, 3]})
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can add a filter intersect to keyset', () => {
    const keyset = table.getKeyset().intersect({field: 'tags', values: ['b']})
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can add a filter where to keyset', () => {
    const keyset = table.getKeyset().where({field: 'id', value: 1})
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can add a filter null to keyset', () => {
    const keyset = table.getKeyset().isNull({field: 'id'})
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can add a filter not null to keyset', () => {
    const keyset = table.getKeyset().notNull({field: 'id'})
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can add a raw where and order clauses to the keyset', () => {
    const keyset = table.getKeyset().rawWhere('id is null').rawOrder('id asc nulls last')
    expect(keyset.toSql()).toMatchSnapshot()
  })

  test('can convert a keyset into an opaque cursor and back (search)', () => {
    const keyset = table.getKeyset()
      .seek({field: 'id', value: 0, searchQuery: 'my search query'})
      .notNull({field: 'id'})
      .in({field: 'id', values: [1, 2]})
      .where({field: 'id', value: 1})
      .intersect({field: 'tags', values: ['a']})
    const cursor = keyset.toOpaqueCursor()
    expect(cursor).toMatchSnapshot()
    const newKeyset = table.getKeyset().fromOpaqueCursor(cursor)
    const firstSql = keyset.toSql()
    const secondSql = newKeyset.toSql()
    expect(firstSql).toEqual(secondSql)
    expect(firstSql).toMatchSnapshot()
  })

  test('can convert a keyset into an opaque cursor and back (basic)', () => {
    const keyset = table.getKeyset()
      .seek({field: 'id', value: 1, desc: true})
      .isNull({field: 'id'})
    const firstSql = keyset.toSql()
    const secondSql = keyset.clone().toSql()
    expect(firstSql).toEqual(secondSql)
    expect(firstSql).toMatchSnapshot()
  })

  test('can parse a graphql style cursor query', () => {
    const keyset = table.getKeyset()
      .seek({field: 'id', value: 1, desc: true})
      .isNull({field: 'id'})
    const from = keyset.toOpaqueCursor()
    const nextKeyset = table.getKeyset().continue({from, next: 1})
    const prevKeyset = table.getKeyset().continue({from, prev: 1})
    expect(nextKeyset.seekParams).toMatchObject(keyset.seekParams)
    expect(prevKeyset.seekParams).toMatchObject(keyset.seekParams)
  })

  test('updating from result does not affect the original keyset', () => {
    const keyset = table.getKeyset()
      .seek({field: 'id'})

    const newKeyset = keyset.newFromResult({row: {id: 1}})

    expect(keyset.seekParams[0].value).toBeUndefined()
    expect(newKeyset.seekParams[0].value).toBeDefined()
  })
})
