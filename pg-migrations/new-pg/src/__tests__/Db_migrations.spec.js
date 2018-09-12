/**
 * @flow
 */

const { Db } = require('../')
const path = require('path')
const sqlDirectory = path.join(__dirname, 'sql')

const randomNum = Math.floor(Math.random() * 1000)
describe('db migrations', () => {
  test('it will wait for a first db to stop migrationg', async () => {
    const db1 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-migration-one-' + randomNum, schemaVersion: 0.2})
    const db2 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-migration-one-' + randomNum, schemaVersion: 1.0})
    try {
      const db1StartedMigrating = (new Promise(resolve => {
        db1.on('migrate', resolve)
      }))
      const db1FinishedMigrating = db1.sync().then(async () => {
        const ver = await db1.getVersion()
        expect(ver).toBe(0.2)
      })
      await db1StartedMigrating
      await db2.sync()
      const ver = await db2.getVersion()
      expect(ver).toBe(1.0)
      await db1FinishedMigrating
    } finally {
      await db2.__poolDown()
      await db1.close()
    }
  }, 12000)

  test('it will throw an error if it is a previous version', async () => {
    const db1 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-migration-2-' + randomNum, schemaVersion: 49.12})
    const db2 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-migration-2-' + randomNum, schemaVersion: 50.2})
    let error
    try {
      await db2.sync()
      const ver = await db2.getVersion()
      expect(ver).toBe(50.2)
      await db1.sync()
    } catch (err) {
      console.error(err)
      error = err
    } finally {
      await db1.close()
      await db2.__poolDown()
    }
    expect(error).toBeDefined()
  }, 12000)

  test('it will throw an error if a migration script does not complete', async () => {
    const db1 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-migration-3-' + randomNum, schemaVersion: 0.2})
    const db2 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-migration-3-' + randomNum, schemaVersion: 500.1})
    let error
    try {
      await db1.sync()
      await db2.sync()
    } catch (err) {
      error = err
    } finally {
      await db1.close()
      await db2.__poolDown()
    }
    expect(error).toBeDefined()
  }, 12000)
})
