/**
 * @flow
 * @ignore
 */

import type { ResultSet, Row, PoolClient } from './Db.types.js'
import type {
  Serializable,
  KeysetSerialParam,
  KeysetSerialized,
  KeysetSeekParam,
  KeysetSeekInput,
  KeysetFieldParam,
  KeysetNullParam,
  KeysetParam,
  KeysetSliceParam,
  KeysetWhereParam,
  AfterOrBefore,
  SqlConditionParams,
  KeysetContinueQuery,
  KeysetStartQuery,
  PageInfo,
  Edge,
  ConnectionResult
} from './Keyset.types.js'

const format = require('pg-format')
const Db = require('./Db')
const Table = require('./Table')

/**
 * The keyset provides paginated queries to the DB. It should be created from a table instance
 * @example
 * // produce a paginated result with cursors using the keyset helper
 * const keyset = db.getTable('pagination_land').getKeyset()
 *
 * // search for the first 12 rows orderd with the seq column.
 * const {edges, pageInfo} = await keyset.start({field: 'seq', first: 12}).query()
 * // edges[0].cursor = 'a_very_opaque-cursor'
 *
 * // later when the client wants more results:
 * const {edges, pageInfo} = await keyset.continue({from: 'a_very_opaque_cursor', prev: 12}).query()
 */
class Keyset {
  db: Db
  table: Table
  seekParams: KeysetSeekParam[]
  inParams: KeysetSliceParam[]
  intersectParams: KeysetSliceParam[]
  whereParams: KeysetWhereParam[]
  nullParams: KeysetNullParam[]
  additionalConditions: SqlConditionParams
  rawGroupCondition: string
  afterOrBefore: AfterOrBefore
  limitResults: number
  joins: string[]

 static cursorQuery () {

  }

  /**
   * The keyset provides paginated queries to the DB. It should be created from a table instance
   */
  constructor (params: { db: Db, table: Table}) {
    this.db = params.db
    this.table = params.table
    this.seekParams = []
    this.intersectParams = []
    this.whereParams = []
    this.inParams = []
    this.nullParams = []
    this.joins = []
    this.afterOrBefore = 'after'
    this.additionalConditions = { where: [], order: [], select: [] }
    this.limitResults = 20
  }

  /**
   * Add a join statement using a long form join statement (join X on Y)
   * Like all rawXXX methods this is not encoded in the keyset for safety reasons
   */
  rawJoin (sqlText: string): Keyset {
    this.joins.push(sqlText)
    return this
  }

  /**
   * Provide a field and value to seek from
   */
  seek (params: KeysetSeekInput): Keyset {
    this.seekParams.push({desc: false, ...params})
    return this
  }

  /**
   * Limit results from the keyset
   */
  limit (limit: number): Keyset {
    this.limitResults = limit
    return this
  }

  /**
   * Filter rows by intersecting them with another array
   */
  intersect (params: KeysetSliceParam) {
    this.intersectParams.push(params)
    return this
  }

  /**
   * Filter rows based on a column being equal to a value
   */
  where (params: KeysetWhereParam) {
    this.whereParams.push(params)
    return this
  }

  /**
   * Filter rows based on a column value belong to a series of values
   */
  in (params: KeysetSliceParam) {
    this.inParams.push(params)
    return this
  }

  /**
   * Filter rows where the column is null
   */
  isNull (params: KeysetFieldParam) {
    this.nullParams.push({...params, null: true})
    return this
  }

  /**
   * Filter rows where the column is not null
   */
  notNull (params: KeysetFieldParam) {
    this.nullParams.push({...params, null: false})
    return this
  }

  /**
   * Get the keyset as a cursor
   */
  toOpaqueCursor (): string {
    const serializedKeyset = this.__serialize()
    const paramString = JSON.stringify(serializedKeyset)
    return Buffer.from(paramString).toString('base64')
  }

  /**
   * Decode a cursor and set the keyset to its values
   */
  fromOpaqueCursor (cursor: string) {
    const paramString = Buffer.from(cursor, 'base64').toString('utf8')
    const serializedKeyset = JSON.parse(paramString)
    this.__decode(serializedKeyset)
    return this
  }

  /**
   * Specify columns to select
   */
  select (column: string | string[]) {
    if (Array.isArray(column)) {
      this.additionalConditions.select.push.apply(this.additionalConditions.select, column)
    } else {
      this.additionalConditions.select.push(column)
    }
    return this
  }

  /**
   * Specify a raw snippt of SQL for the where condition.
   * Note that for security this is not serialized.
   */
  rawWhere (condition: string) {
    this.additionalConditions.where.push(condition)
    return this
  }

  /**
   * Specify a raw snippt of SQL for the order condition
   * Note that for security this is not serialized.
   */
  rawOrder (condition: string) {
    this.additionalConditions.order.push(condition)
    return this
  }

  rawGroupBy (condition: string) {
    this.rawGroupCondition = condition
    return this
  }

  /**
   * Specify that the keyset should seek after the cursor
   */
  after () {
    this.afterOrBefore = 'after'
    return this
  }

  /**
   * Specify that the keyset should seek before the cursor
   */
  before () {
    this.afterOrBefore = 'before'
    return this
  }

  /**
   * Creates a cursor from the paramters used at query time the results and the colum (attr) used to order results
   * @param {ResultSet} result
   */
  resultToEdge ({rows}: ResultSet): Edge<mixed>[] {
    return rows.map(row => {
      const keyset = this.newFromResult({row})
      return {
        node: row,
        cursor: keyset.toOpaqueCursor()
      }
    })
  }

  /**
   * Sets up the keyset query.
   * If desc is not explictely set then results will be returned in descending order
   *  if searchQuery is specified and first is specified
   *  If searchQuery is not specefied and last is specified
   * @param {KeysetStartQuery} {field, searchQuery, desc, first, last}
   */
  start ({field, searchQuery, desc, first, last, defaultLast}: KeysetStartQuery) {
    if (first && last) {
      throw new Error('cannot specify both next and prev')
    }
    if (typeof first !== 'number' && typeof last !== 'number') {
      if (defaultLast) {
        last = 20
      } else {
        first = 20
      }
    }
    const limit = typeof first === 'number' ? first : last
    if (typeof limit !== 'number') {
      throw new Error('expect first or last to be a number')
    }
    this.limit(limit)
    let isDesc
    if (desc) {
      isDesc = desc
    } else {
      if (searchQuery) {
        isDesc = typeof first === 'number'
      } else {
        isDesc = typeof last === 'number'
      }
    }
    this.seek({ field, searchQuery, desc: isDesc })
    return this
  }

  /**
   * Parses a cursor query param object into sql keyset paramters so that results from a previous query can be returned
   * @param {CursorQuery} query
   */
  continue ({from, next, prev}: KeysetContinueQuery) {
    this.fromOpaqueCursor(from)
    /* istanbul ignore if */
    if (next && prev) {
      throw new Error('cannot specify both next and prev')
    }
    if (!next && !prev) {
      next = 20
    }
    if (next) {
      this.limitResults = next
      this.afterOrBefore = 'after'
    }
    if (prev) {
      this.limitResults = prev
      this.afterOrBefore = 'before'
    }
    return this
  }

  /**
   * Get a copy of this keyset
   * Deprecated do not use
   */
  clone (): Keyset {
    // TODO: remove this by refactoring adding a new 'state' property
    const serialized = this.__serialize()
    const newKeyset = new Keyset({db: this.db, table: this.table})
    newKeyset.afterOrBefore = this.afterOrBefore
    newKeyset.__decode(serialized)
    newKeyset.additionalConditions = { ...this.additionalConditions }
    newKeyset.rawGroupCondition = this.rawGroupCondition
    newKeyset.joins = this.joins
    return newKeyset
  }

  /**
   * Get a map of where, select, and order conditions
   */
  getConditions (): SqlConditionParams {
    const conditionsMap: SqlConditionParams[] = []

    for (const key of this.seekParams) {
      conditionsMap.push(this.__seekKeyToSql(key))
    }
    return this.__getTermsFromConditions([ ...conditionsMap, ...this.__getOtherConditions() ])
  }

  __getOtherConditions (): SqlConditionParams[] {
    const conditionsMap: SqlConditionParams[] = []
    for (const param of this.inParams) {
      conditionsMap.push(this.__inKeysToSql(param))
    }

    for (const param of this.whereParams) {
      conditionsMap.push(this.__whereToSql(param))
    }

    for (const param of this.intersectParams) {
      conditionsMap.push(this.__intersectToSql(param))
    }

    for (const param of this.nullParams) {
      conditionsMap.push(this.__nullKeysToSql(param))
    }
    return conditionsMap
  }
  __getTermsFromConditions (conditionsMap: SqlConditionParams[]) {
    // group all the conditions as where and order terms
    const terms = conditionsMap
      .reduce(
        (accum: SqlConditionParams, cond: SqlConditionParams) => {
          return {
            where: accum.where.concat(cond.where),
            order: accum.order.concat(cond.order),
            select: accum.select.concat(cond.select)
          }
        },
        this.additionalConditions
      )
    return terms
  }

  /**
   * Produce an SQL query for the keyset
   */
  toSql (): string {
    // create where and order by sql clausses
    const terms = this.getConditions()
    const select = terms.select.length > 0 ? `SELECT ${terms.select.join(', ')}` : 'SELECT null'
    const where = terms.where.length > 0 ? `WHERE ${terms.where.join(' AND ')}` : ''
    // the reverse here is a really flaky hack to make the extra seek 'maybeEqual' first
    // might consider using a group by instead
    const order = terms.order.length > 0 ? `ORDER BY ${terms.order.reverse().join(', ')}` : ''
    const group = this.rawGroupCondition ? `GROUP BY ${this.rawGroupCondition}` : ''
    const sql = `
      ${select}
      ${this.__toFromSql()}
      ${where}
      ${group}
      ${order}
      LIMIT ${this.limitResults}
    `
    return sql
  }

  /**
   * Produce an SQL query for counting all records
   */
  totalCountSql (): string {
    // create where and order by sql clausses
    const terms = this.__getTermsFromConditions(this.__getOtherConditions())
    const where = terms.where.length > 0 ? `WHERE ${terms.where.join(' AND ')}` : ''

    return `
      SELECT count(*)::int
      ${this.__toFromSql()}
      ${where}
    `
  }
  /**
   * Take a resulting row and use its value to update the seek parameters in the Keyset
   * @param {Row} row
   */
  newFromResult ({row}: {row: Row}): Keyset {
    const newKeyset = this.clone()
    newKeyset.__updateKeyset({row})
    return newKeyset
  }

  /**
   * Use the keyset to make a query and return the results as per the graphql connection model
   */
  async query (): Promise<ConnectionResult<mixed>> {
    const client = await this.db.transact()
    let connectionResult
    try {
      const results = await client.query(this.toSql())
      const pageInfo = await this.__getPageInfo(results, client)
      connectionResult = {
        edges: this.resultToEdge(results),
        pageInfo
      }
      await client.query('commit')
    } catch (err) {
      await client.query('rollback')
      throw err
    } finally {
      client.release()
    }
    return connectionResult
  }

  async __getPageInfo ({rows, rowCount}: ResultSet, client: PoolClient): Promise<PageInfo> {
    let hasNextPage = false
    let hasPrevPage = false
    let totalCount = 0
    const countPromise = client.query({text: this.totalCountSql()})
    const promises: any[] = [countPromise]
    if (rowCount && rowCount > 0) {
      const nextFromRow = rows[rowCount - 1]
      const prevFromRow = rows[0]
      const nextKeyset = this.newFromResult({row: nextFromRow})
      const prevKeyset = this.newFromResult({row: prevFromRow})
      if (nextKeyset.seekParams[0].value) {
        const nextQuery = nextKeyset.after().limit(1).toSql()
        const nextPromise = client.query({text: nextQuery})
        promises.push(nextPromise)
      }

      if (prevKeyset.seekParams[0].value) {
        const prevQuery = prevKeyset.before().limit(1).toSql()
        const prevPromise = client.query({text: prevQuery})
        promises.push(prevPromise)
      }
    }
    const [
      { rows: totalRows },
      { rowCount: nextRows } = {},
      { rowCount: prevRows } = {}
    ] = await Promise.all(promises)

    hasPrevPage = !!prevRows && prevRows > 0
    hasNextPage = !!nextRows && nextRows > 0
    totalCount = (totalRows[0] && totalRows[0].count) || 0
    return {
      totalCount,
      hasNextPage,
      hasPrevPage
    }
  }

  __serialize (): KeysetSerialized {
    return {
      s: this.seekParams.map((param: any) => this.__serializeParam(param)),
      f: this.inParams.map((param: any) => this.__serializeParam(param)),
      w: this.whereParams.map((param: any) => this.__serializeParam(param)),
      i: this.intersectParams.map((param: any) => this.__serializeParam(param)),
      n: this.nullParams.map((param: any) => this.__serializeParam(param))
    }
  }

  __serializeParam (params: KeysetParam): KeysetSerialParam {
    const { field, value, values, desc, null: nullV, searchQuery, maybeEqual } = params
    let v
    if (typeof value !== 'undefined') {
      v = value
    } else if (Array.isArray(values)) {
      v = values
    }
    return {
      v,
      f: field,
      d: desc,
      n: nullV,
      q: searchQuery,
      m: maybeEqual
    }
  }

  __decode ({s, f, w, i, n}: KeysetSerialized) {
    this.seekParams = s.map(param => this.__decodeSeekParam(param))
    this.inParams = f.map(param => this.__decodeSliceParam(param))
    this.whereParams = w.map(param => this.__decodeWhereParam(param))
    this.intersectParams = i.map(param => this.__decodeSliceParam(param))
    this.nullParams = n.map(param => this.__decodeNullParam(param))
  }

  __decodeSeekParam ({f, v, s, d, q, m}: KeysetSerialParam): KeysetSeekParam {
    /* istanbul ignore if - this is mostly to make flow happy */
    if (Array.isArray(v)) { throw new Error('incorrect encoded seek obj, cannot be array') }
    const param: KeysetSeekParam = { field: f, desc: false, value: v }
    if (q) {
      param.searchQuery = q
    }
    if (d) {
      param.desc = true
    }
    if (m) {
      // $FlowFixMe both of these are "Serializable" type but getting number or string incompatible with boolean
      param.maybeEqual = m
    }
    return param
  }

  __decodeWhereParam ({f, v}: KeysetSerialParam): KeysetWhereParam {
    const value = v
    return {
      field: f,
      // $FlowFixMe
      value
    }
  }

  __decodeSliceParam ({f, v}: KeysetSerialParam): KeysetSliceParam {
    const values = v
    return {
      field: f,
      // $FlowFixMe
      values
    }
  }

  __decodeNullParam ({f, n}: KeysetSerialParam): KeysetNullParam {
    const value = n
    return {
      field: f,
      // $FlowFixMe
      null: value
    }
  }

  // helper for creating a new keyset from a resulting row, which can then used to get
  // a cursor for that row.
  __updateKeyset ({row}: {row: Row}) {
    this.seekParams.forEach(({similarity, searchQuery, value, field, desc, maybeEqual}, i, arr) => {
      let newValue
      if (searchQuery) {
        newValue = ((row.sml: any): number)
      } else {
        const fieldCamelCased = field.replace(/(_\w)/g, (k) => k[1].toUpperCase())
        // if the result is not serializable it could cause issues
        newValue = ((row[fieldCamelCased]: any): Serializable)
      }
      // modify on this.seekParams
      arr[i] = {searchQuery, value: newValue, field, desc, maybeEqual}
    })
  }

  __toFromSql () {
    return `FROM ${[this.table.name, ...this.joins].join(' ')}`
  }

  __nullKeysToSql (param: KeysetNullParam): SqlConditionParams {
    const { null: isNull, field } = param
    if (isNull) {
      return {where: [format(`${this.table.name}.%I IS NULL`, field)], order: [], select: []}
    } else {
      return {where: [format(`${this.table.name}.%I IS NOT NULL`, field)], order: [], select: []}
    }
  }

  __whereToSql (param: KeysetWhereParam): SqlConditionParams {
    const { value, field } = param
    const prefixedField = this.__prefixFieldWithTableIfNecessary(field)
    return {where: [format(`${prefixedField} = %L`, value)], order: [], select: []}
  }

  __intersectToSql (param: KeysetSliceParam): SqlConditionParams {
    const { field, values } = param
    // Use the array overlap postgres to find elements where the colum given by field has elements in common with the given search query
    return {where: [format('%I && ARRAY[%L]', field, values)], order: [], select: []}
  }

  __inKeysToSql (param: KeysetSliceParam): SqlConditionParams {
    const { field, values } = param
    return {where: [format('%I IN (%L)', field, values)], order: [], select: []}
  }

  __seekKeyToSql (key: KeysetSeekParam): SqlConditionParams {
    const {searchQuery, field, value, desc, maybeEqual} = key

    let op
    if (this.afterOrBefore === 'after') {
      if (!desc) {
        op = '>'
      } else {
        op = '<'
      }
    } else {
      if (!desc) {
        op = '<'
      } else {
        op = '>'
      }
    }

    const sort = desc ? 'DESC' : 'ASC'
    const where = []
    const select = []
    const order = []
    // we dont handle cases wheree the value of the field is null
    // note we require that the field we are using for seeking is in the original table
    // this is to support joins
    const fieldPrefixed = this.__prefixFieldWithTableIfNecessary(field)
    if (typeof maybeEqual !== 'undefined') {
      if (typeof value === 'undefined' || value === maybeEqual) {
        where.push(format(`(${fieldPrefixed} = %L or ${fieldPrefixed} is null)`, maybeEqual))
      } else {
        where.push(format(`${fieldPrefixed} is null`, maybeEqual))
      }
      // consider using a group by instead
      order.unshift(`${fieldPrefixed} ${sort}`)
    } else {
      where.push(`${fieldPrefixed} is not null`)
      if (searchQuery) {
        where.push(format(`similarity(${fieldPrefixed}, %L) > %L`, searchQuery, getMinSimilarity(searchQuery)))
        if (typeof value !== 'undefined') {
          where.push(format(`similarity(${fieldPrefixed}, %L) ${op} %L`, searchQuery, value))
        }
        order.push(format(`similarity(${fieldPrefixed}, %L) ${sort}`, searchQuery))
        select.push(format(`similarity(${fieldPrefixed}, %L) as sml`, searchQuery))
      } else {
        order.push(`${fieldPrefixed} ${sort}`)
        if (typeof value !== 'undefined') {
          where.push(format(`${fieldPrefixed} ${op} %L`, value))
        }
      }
    }

    return { order, where, select }
  }
  __prefixFieldWithTableIfNecessary (field: string) {
    if (field.match(/\./)) {
      const [ table, column ] = field.split('.')
      return format('%I.%I', table, column)
    } else {
      return format('%I.%I', this.table.name, field)
    }
  }
}

function getMinSimilarity (searchQuery: string): number {
  if (searchQuery.length === 1) return 0.01
  if (searchQuery.length === 2) return 0.05
  if (searchQuery.length === 3) return 0.1
  return 0.2
}

module.exports = Keyset
