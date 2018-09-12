/**
 * @flow
 */

const { Db } = require('../')
const path = require('path')
const sqlDirectory = path.join(__dirname, 'sql')

const randomNum = Math.floor(Math.random() * 1000)

describe('db concurrency', () => {
  test('it can handle two dbs of the same version starting at the same time', async () => {
    const db2 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-concurreny-1' + randomNum, schemaVersion: 0.4})
    const db1 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-concurreny-1' + randomNum, schemaVersion: 0.4})
    try {
      await Promise.all([db2.sync(), db1.sync()])
      const { rowCount } = await db2.query(`select * from test`)
      expect(rowCount).toBe(463)
    } finally {
      await db1.__poolDown()
      await db2.__poolDown()
    }
  }, 18000)

  test('it can handle 10 dbs of the same version starting very shortly one after another', async () => {
    const OPTIONS = {sqlDirectory, overrideEnv: true, schemaBase: 'test-concurreny-2' + randomNum, schemaVersion: 0.4}
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push((new Db(OPTIONS)).sync())
    }
    let dbs: Db[]
    try {
      dbs = await Promise.all(promises)
      const { rowCount } = await dbs[0].query(`select * from test`)
      expect(rowCount).toBe(463)
    } catch (err) {
      console.error(err)
    } finally {
      dbs && await Promise.all(dbs.map(db => db.__poolDown()))
    }
  }, 18000)

  test('it can handle two dbs of the same version starting shortly one after another', async () => {
    const db2 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-concurreny-3' + randomNum, schemaVersion: 0.4})
    const db1 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-concurreny-3' + randomNum, schemaVersion: 0.4})
    try {
      const p1 = db2.sync()
      await (new Promise(resolve => setTimeout(resolve, 200)))
      await db1.sync()
      await p1
      const { rowCount } = await db2.query(`select * from test`)
      expect(rowCount).toBe(463)
    } finally {
      await db1.__poolDown()
      await db2.__poolDown()
    }
  }, 18000)
})
