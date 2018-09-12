/**
 * In order to facilitate high-fidelity snapshots of tables
 * we use this wrapper around the command-line psql client
 * so that we can use its (pretty good) commands for describing tables
 * THIS SHOULD BE USED IN DEVEOPMENT ENVS ONLY
 * @flow
 */

import type Db from './Db'
import type { ChildProcess } from 'child_process'
const cp = require('child_process')
const dedent = require('dedent')

class PsqlWrapper {
  db: Db
  psql: ChildProcess
  isInitialized: Promise<boolean>
  constructor (db: Db) {
    this.db = db

    this.isInitialized = this.initialize()
  }

  async initialize () {
    this.connect()
    this.errorListen()
    await this.setSearchPath()
    return true
  }

  async close () {
    this.psql.removeAllListeners('close')
    this.psql.kill()
  }

  errorListen () {
    this.psql.on('error', (err) => {
      console.error(err)
    })
    this.psql.on('close', (code) => {
      if (code !== 0) {
        console.error(`psql exited with code ${code}`)
      }
    })
  }

  connect () {
    // -A means unaligned output mode
    this.psql = cp.spawn('psql', ['-A'], {env: process.env})
    this.psql.setMaxListeners(20)
    this.psql.stdout.setEncoding('utf8')
    this.psql.stdout.setMaxListeners(20)
    this.psql.stderr.setEncoding('utf8')
    this.psql.stderr.setMaxListeners(20)
  }

  setSearchPath (): Promise<string> {
    return new Promise((resolve, reject) => {
      this.psql.stdin.write(`set search_path to "${this.db.schemaName}";\n`)
      this.psql.stdout.once('data', resolve)
      this.psql.stderr.once('data', reject)
    })
  }

  async describeTable (tableName: string): Promise<string> {
    await this.isInitialized
    const desc = await new Promise((resolve, reject) => {
      this.psql.stdin.write(`\\d "${tableName}"\n`)
      this.psql.stdout.once('data', resolve)
      this.psql.stderr.once('data', reject)
    })
    return dedent(desc.replace(new RegExp(this.db.schemaName, 'g'), '<schema_name>'))
  }

  // useful for describing enums
  async describeUserTypes (): Promise<string> {
    await this.isInitialized
    const desc = await new Promise((resolve, reject) => {
      this.psql.stdin.write(`\\dT+\n`)
      this.psql.stdout.once('data', resolve)
      this.psql.stderr.once('data', reject)
    })
    return dedent(desc.replace(new RegExp(this.db.schemaName, 'g'), '<schema_name>'))
  }
}

module.exports = PsqlWrapper
