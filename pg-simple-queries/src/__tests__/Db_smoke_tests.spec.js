/**
 * @flow
 */

const { Db } = require('../')
const path = require('path')

const OPTIONS = {
  schemaBase: 'db_smoke_tests',
  schemaVersion: 1.0,
  sqlDirectory: path.join(__dirname, 'sql')
}

describe('Db', () => {
  // this is a basic connectivity test, failing it means the issue is probly config
  test('it can connect and get time', async () => {
    const db = new Db(OPTIONS)
    await db.__poolUp()
    try {
      const nowResult = await db.query('SELECT NOW();')
      const nowTs = nowResult.rows[0].now
      const dbTime = nowTs.getTime()
      // expect time from db equal js time by 10 seconds
      expect(Math.floor(dbTime / 10000)).toBe(Math.floor(Date.now() / 10000))
    } finally {
      await db.__dbDisconnect()
    }
  })

  test('it can setup and tear down with no params', async () => {
    const db = new Db(OPTIONS)
    try {
      await db.sync()
    } finally {
      await db.close()
    }
  }, 12000)
})
