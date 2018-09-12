/**
 * @flow
 */

const { Db, PsqlWrapper } = require('../')
const path = require('path')
const sqlDirectory = path.join(__dirname, 'sql')
const randomNum = Math.floor(Math.random() * 1000)

let db1

beforeAll(async () => {
  db1 = new Db({sqlDirectory, overrideEnv: true, schemaBase: 'test-psql-wrapper' + randomNum, schemaVersion: 0})
  await db1.sync()
})

afterAll(async () => {
  await db1.close()
})

describe('psql wrapper', () => {
  it('can initialize', async () => {
    const psql = new PsqlWrapper(db1)
    await psql.isInitialized
  }, 10000)

  it('can describe a table', async () => {
    const psql = new PsqlWrapper(db1)
    const desc = await psql.describeTable('test')
    expect(desc).toMatchSnapshot()
  })
})
