/**
 * @flow
 */

const { Db, MigrationHelper } = require('../')
const path = require('path')

const VERSION = 0.4
const SQLPATH = path.join(__dirname, 'sql')
const OPTIONS = {
  schemaBase: 'db_method_tests',
  schemaVersion: VERSION,
  sqlDirectory: SQLPATH
}

describe('MigrationHelper', () => {
  test('__getSqlFiles it gets the correct indepotent and migrations files (unfiltered)', async () => {
    const db = new Db(OPTIONS)
    const helper = new MigrationHelper(db)
    const files = await helper.__getSqlFiles(SQLPATH)
    expect(files.map(file => file.filename)).toEqual([
      'test_table.sql',
      'test_table.v0.1.snap.sql',
      'test_table.v0.2.pre.sql',
      'test_table.v0.2.snap.sql',
      'test_table.v0.3.pre.sql',
      'test_table.v0.3.snap.sql',
      'test_table.v0.4.post.sql',
      'test_table.v1.0.post.sql',
      'test_table.v1.0.pre.sql',
      'test_table.v500.1.pre.sql'
    ])
  })

  test('__getMigrationsForVersion it gets the correct migrations for migrating from 0 to 0.4', async () => {
    const db = new Db(OPTIONS)
    const helper = new MigrationHelper(db)
    await helper.isInitialized
    const migrationsInfo = await helper.__getMigrationsForVersion(0)
    expect(migrationsInfo.length).toBe(4)
    expect(migrationsInfo[0].preMigrations.length).toBe(0)
    expect(migrationsInfo[0].idempotents.length).toBe(0)
    expect(migrationsInfo[0].snapshots.map(file => file.filename)).toEqual(['test_table.v0.1.snap.sql'])
    expect(migrationsInfo[0].postMigrations.length).toBe(0)

    expect(migrationsInfo[1].preMigrations.map(file => file.filename)).toEqual(['test_table.v0.2.pre.sql'])
    expect(migrationsInfo[1].idempotents.length).toBe(0)
    expect(migrationsInfo[1].snapshots.map(file => file.filename)).toEqual(['test_table.v0.2.snap.sql'])
    expect(migrationsInfo[1].postMigrations.length).toBe(0)

    expect(migrationsInfo[2].preMigrations.map(file => file.filename)).toEqual(['test_table.v0.3.pre.sql'])
    expect(migrationsInfo[2].idempotents.length).toBe(0)
    expect(migrationsInfo[2].snapshots.map(file => file.filename)).toEqual(['test_table.v0.3.snap.sql'])
    expect(migrationsInfo[2].postMigrations.length).toBe(0)

    expect(migrationsInfo[3].preMigrations.length).toBe(0)
    expect(migrationsInfo[3].idempotents.map(file => file.filename)).toEqual(['test_table.sql'])
    expect(migrationsInfo[3].snapshots.length).toBe(0)
    expect(migrationsInfo[3].postMigrations.map(file => file.filename)).toEqual(['test_table.v0.4.post.sql'])
  })

  test('__getMigrationsForVersion it gets the correct migrations for migrating from 0.0 to 0.1', async () => {
    const db = new Db({...OPTIONS, schemaVersion: 0.1})
    const helper = new MigrationHelper(db)
    await helper.isInitialized
    const migrationsInfo = await helper.__getMigrationsForVersion(0)
    expect(migrationsInfo.length).toBe(1)
    expect(migrationsInfo[0].idempotents.length).toBe(0)
    expect(migrationsInfo[0].preMigrations.length).toBe(0)
    expect(migrationsInfo[0].snapshots.map(file => file.filename)).toEqual(['test_table.v0.1.snap.sql'])
    expect(migrationsInfo[0].postMigrations.length).toBe(0)
  })

  test('__getMigrationsForVersion it gets the correct migrations for migrating from 0.2 to 0.3', async () => {
    const db = new Db({...OPTIONS, schemaVersion: 0.3})
    const helper = new MigrationHelper(db)
    await helper.isInitialized
    const migrationsInfo = await helper.__getMigrationsForVersion(0.2)
    expect(migrationsInfo.length).toBe(1)
    expect(migrationsInfo[0].preMigrations.map(file => file.filename)).toEqual(['test_table.v0.3.pre.sql'])
    expect(migrationsInfo[0].idempotents.length).toBe(0)
    expect(migrationsInfo[0].snapshots.map(file => file.filename)).toEqual(['test_table.v0.3.snap.sql'])
    expect(migrationsInfo[0].postMigrations.length).toBe(0)
  })
})
