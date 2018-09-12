/**
 * A helper class to read the sql directory and lint the files
 * @flow
 */

const glob = require('glob-promise')
const path = require('path')

type VersionInfo = {
  version: number,
  schema: string,
  up: string[],
  down: string[],
  snap: string[]
}

const UP = /[0-9a-Z_-]+\.up\.sql/
const DOWN = /[0-9a-Z_-]+.down\.sql/
const SNAP = /[0-9a-Z_-]+\.sql/
function parseSqlScriptName (name: string) {
  if (name.match(UP)) {
    return 'up'
  } else if (name.match(DOWN)) {
    return 'down'
  } else if (name.match(SNAP)) {
    return 'snap'
  } else {
    throw new Error(`Expected ${name} to be a .sql, .up.sql, or .down.sql file`)
  }
}

class SqlScripts {
  directory: string
  isInitialized: Promise<any>
  versions: VersionInfo[]

  constructor (directory: string) {
    this.directory = directory
    this.versions = []
    this.isInitialized = this.initialize()
  }

  async initialize () {
    const sqlFiles = await glob(path.join(this.directory, '*.sql'))
    sqlFiles.forEach(file => {
      // schema, version and file name from the path
      const split = file.split('/')
      const relevantPath = split.slice(split.length - 2)
      const [ schemaAndVersion, filename ] = relevantPath
      const [ schema, version ] = schemaAndVersion.split('-v')

      // maybe get a prexisting version info in the array
      const preExisting = this.versions.find(v => v.version === version)
      if (preExisting && preExisting.schema !== schema) throw new Error(`Expected ${version} to have only one schema found ${schema} and ${preExisting.schema}`)

      // get whether up, down or snap
      const type = parseSqlScriptName(filename)
      if (preExisting) {
        preExisting[type].push(file)
      } else {
        this.versions.push({
          version,
          schema,
          snap: [],
          up: [],
          down: [],
          [type]: [file]
        })
      }
    })

    // error when there is no snap
    // warn about any missing up or down
    this.versions.forEach((version, index) => {
      if (version.snap.length === 0) throw new Error(`${version.schema}-v${version.version} has no snapshot`)
      if (index > 0) {
        if (version.up.length === 0) console.error(`$${version.schema}-v${version.version} should have an up script`)
        if (version.down.length === 0) console.warn(`$${version.schema}-v${version.version} should have a down script`)
      }
    })
  }
}

module.exports = SqlScripts
