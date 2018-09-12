/**
 * @flow
 * @ignore
 */

const debug = require('debug')('pg:debug')
const info = require('debug')('pg:info')
const verbose = require('debug')('pg:verbose')

const logger = {
  debug: (msg: string) => debug(msg),
  info: (msg: string) => info(msg),
  verbose: (msg: string) => verbose(msg),
  warn: (msg: string) => console.warn(msg),
  error: (msg: string) => console.error(msg)
}

module.exports = logger
