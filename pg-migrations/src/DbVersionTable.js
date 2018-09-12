/**
 * @flow
 */

import type Db from './Db'
const { Client } = require('pg')
const pgFormat = require('pg-format')

class DbVersionTable {
  db: Db
  isInitialized: Promise<boolean>

  constructor (db: Db) {
    this.db = db
    this.isInitialized = this.__init()
  }

  async __init () {
    await this.__ensureVersionTable()
    return true
  }

  async __ensureVersionTable () {
    const client = new Client()
    await client.connect()
    try {
      await client.query(pgFormat(`set search_path to %I`, this.db.schemaName))
      await client.query({
        text: `
          create table if not exists version (
            version numeric(10, 5) unique,
            deploy_start timestamptz default current_timestamp,
            deployed_ts timestamptz,
            client_count integer default 0,
            payload jsonb,
            payload_version numeric(10, 5) default 0
          )
        `,
        logDebug: false
      })
      this.db.logger.debug('version table created')
    } catch (err) {
      if (err.constraint) {
        this.db.logger.debug(`version table already exists: ${err.constraint}`)
      } else {
        this.db.logger.error(err.stack)
        throw err
      }
    }
  }

  /**
   * get the current version of the remote db.
   */
  async getVersion (): Promise<?number> {
    let version = null
    const { rows: versions, rowCount } = await this.db.query(`
      select version
      from version
      order by deployed_ts desc nulls last
      limit 1
    `)
    /* istanbul ignore else */
    if (rowCount && rowCount > 0) {
      version = parseFloat(versions[0].version)
      if (isNaN(version)) {
        return null
      }
    }
    return version
  }
}

module.exports = DbVersionTable
