/**
 * Create a helm 'overrides' file to inject secrets before
 * installing a helm chart.
 * This is a convenience script for when GITLAB or (dotenv for local)
 * for creating secrets from env variables.
 * Takes a dotenv file name as an argument.
 */

const fs = require('fs')
const path = require('path')
const SECRETS = path.join(__dirname, '..', 'overrides.json')

if (require.main === module) {
  const [dotenv] = process.argv.slice(2)
  if (dotenv) {
    require('dotenv').config({path: dotenv})
  }
  main()
}

function main () {
  createSecretOverrides()
}

function createSecretOverrides () {
  // TODO need to iterate through values.yaml and update them with env vars 
  const secretOverrides = {
  }
  fs.writeFileSync(SECRETS, JSON.stringify(secretOverrides))
}

module.exports = {
  createSecretOverrides
}
