/**
 * @flow
 */

const { Db } = require('../')
const path = require('path')

const OPTIONS = {
  schemaVersion: 0.1,
  schemaBase: 'db_test_migration',
  sqlDirectory: path.join(__dirname, 'sql')
}

describe('using pg to test migrations', () => {
  test('before migration the table and columns dont match', async () => {
    let before: Db, after: Db, beforeDesc: string, afterDesc: string
    try {
      before = new Db(OPTIONS)
      after = new Db(OPTIONS)
      await before.sync()
      await after.sync()
      await after.migrateTo(1)
      beforeDesc = await before.describe()
      afterDesc = await after.describe()
    } finally {
      before && await before.close()
      after && await after.close()
    }
    expect(beforeDesc).not.toEqual(afterDesc)
    expect(beforeDesc).toMatchSnapshot()
    expect(afterDesc).toMatchSnapshot()
  })
  test('after migration the table and columns match', async () => {
    let before: Db, after: Db, beforeDesc: string, afterDesc: string
    try {
      before = new Db(OPTIONS)
      after = new Db(OPTIONS)
      await before.sync()
      await after.sync()
      await after.migrateTo(1)
      await before.migrateTo(1)
      beforeDesc = await before.describe()
      afterDesc = await after.describe()
    } finally {
      before && await before.close()
      after && await after.close()
    }
    expect(beforeDesc).toEqual(afterDesc)
    expect(beforeDesc).toMatchSnapshot()
  }, 10000)
})
