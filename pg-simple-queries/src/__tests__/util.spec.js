/**
 * @flow
 */

const { wrapTransactionOptional } = require('../util')
const Db = require('../Db')
const path = require('path')
const pgFormat = require('pg-format')

const randNum = Math.floor(Math.random() * 1000)
const OPTIONS = {
  schemaVersion: 0.4,
  schemaBase: `utiltest${randNum}`,
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

describe('wrapTransactionOptional', () => {
  it('will not commit anything if it is our own client', async () => {
    const client = await db.transact()
    let result
    try {
      result = await wrapTransactionOptional(db, client, async (client) => {
        const result = await client.query(`insert into test (tags) values ('{"very-special"}') returning *`)
        return result
      })
      await client.query('rollback')
    } finally {
      client.release()
    }
    const resultAgain = await db.query(pgFormat('select * from test where id = %L', result.rows[0].id))
    expect(resultAgain.rows.length).toBe(0)
  })

  it('will will not rollback if its our client and an error throws', async () => {
    const client = await db.transact()
    let err
    try {
      await wrapTransactionOptional(db, client, async (client) => {
        throw new Error('boo')
      })
    } catch (error) {
      err = error
    } finally {
      client.query('rollback')
      client.release()
    }
    expect(err).toBeDefined()
  })
})
