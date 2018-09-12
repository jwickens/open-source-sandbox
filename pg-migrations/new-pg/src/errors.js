/**
 * @flow
 */

import type { QueryConfig } from './Db.types'

/**
 * Custom wrapper around node-pg Error (which is just a standard Error
 */
class DbError extends Error {
  status: number
  constructor (originalErrorOrMessage: Error | string, query: QueryConfig | string) {
    super()
    let queryString
    if (typeof query === 'string') {
      queryString = query
    } else {
      queryString = JSON.stringify(query, null, 2)
    }
    let messageToUse
    if (originalErrorOrMessage instanceof Error) {
      const { toString, constructor, message, ...propsToAssign } = originalErrorOrMessage
      messageToUse = message
      Object.assign(this, propsToAssign)
    } else {
      messageToUse = originalErrorOrMessage
    }
    this.message = `Db Error: ${messageToUse} \nSQL: ${queryString}`
    this.status = 500
  }
}

/**
 * Thrown when the result did not return any rows
 */
class NoResultsFound extends DbError {
  status: number
  constructor (originalErrorOrMessage: Error | string, query: QueryConfig | string) {
    super(originalErrorOrMessage, query)
    this.status = 404
  }
}

module.exports = {
  DbError,
  NoResultsFound
}
