/**
 * @flow
 */

import type { PoolClient, QueryOptions } from './Db.types'
import type Db from './Db'
const { DbError } = require('./errors')

async function executeQueryWithTransactionOptional (db: Db, client: ?PoolClient, query: QueryOptions) {
  let isOwnClient = false
  if (!client) {
    client = await db.transact()
    isOwnClient = true
  }
  try {
    const result = await client.query(query)
    if (isOwnClient) {
      await client.query('commit')
    }
    return result
  } catch (err) {
    if (isOwnClient) {
      await client.query('rollback')
    }
    throw new DbError(err, query)
  } finally {
    if (isOwnClient) {
      client.release()
    }
  }
}

async function wrapTransactionOptional(
  db: Db,
  client: ?PoolClient,
  func: PoolClient => Promise<any>
) {
  let isOwnClient = false
  if (!client) {
    client = await db.transact()
    isOwnClient = true
  }
  try {
    const result: any = await func(client)
    if (isOwnClient) {
      await client.query('commit')
    }
    return result
  } catch (err) {
    if (isOwnClient) {
      await client.query('rollback')
    }
    throw err
  } finally {
    if (isOwnClient) {
      client.release()
    }
  }
}

async function wrapInNewTransaction(db: Db, func: PoolClient => Promise<any>) {
  const client = await db.transact()
  try {
    const result = await func(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback')
    // don't swallow errors
    throw err
  } finally {
    client.release()
  }
}

module.exports = { wrapTransactionOptional, wrapInNewTransaction, executeQueryWithTransactionOptional }
