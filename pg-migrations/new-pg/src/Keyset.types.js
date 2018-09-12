/**
 * @flow
 * @ignore
 */

/**
 * A query based on a cursor takes an opaque cursor in the from field and specifies a number of results either before or after the given cursor
 */
export type KeysetStartQuery = {
  field: string,
  desc?: boolean,
  searchQuery?: string,
  first?: ?number,
  last?: ?number,
  defaultLast?: boolean
}

/**
 * A query based on a cursor takes an opaque cursor in the from field and specifies a number of results either before or after the given cursor
 */
export type KeysetContinueQuery = {
  from: string,
  prev?: ?number,
  next?: ?number
}

/**
 * Keysets only support a few formats for serialization. Make sure that the columns you are using as part of the keyset query support these.
 */
export type Serializable = number | string | boolean

/**
 * Specifies a column and whether we are looking for rows with that column set to null or not
 */
export type KeysetNullParam = {
  field: string,
  null: boolean
}

/**
 * Specifies a column and an array of values that to find rows with matching one of those values
 */
export type KeysetSliceParam = {
  field: string,
  values: $ReadOnlyArray<Serializable>
}

/**
 * Specifies a column and a value to filter rows by
 */
export type KeysetWhereParam = {
  field: string,
  value: null | Serializable
}

/**
 * The seek parameter specifies which results to look after or before.
 * If searchQuery is specified (the search term to use) so should similarity (the point at similarity sorted list to return results from)
 */
export type KeysetSeekInput = {
  field: string,
  value?: Serializable,
  searchQuery?: string,
  desc?: boolean
}

export type KeysetSeekParam = {
  field: string,
  value?: Serializable,
  similarity?: number,
  searchQuery?: string,
  desc: boolean
}

export type KeysetParam = {
  field: string,
  value?: Serializable,
  values?: Array<Serializable>,
  searchQuery?: string,
  desc?: boolean,
  null?: boolean
}

/**
 * the page info object provides information on the availibility of further results before and after the paginated results
 */
export type PageInfo = {
  totalCount: number,
  hasNextPage: boolean,
  hasPrevPage: boolean
}

/**
 * The edge wraps together a result row (the node) and the opaque cursor representing the nodes place in the list
 */
export type Edge<Record = mixed> = {
  cursor: string,
  node: Record
}

/**
 * A result based on the connection model
 */
export type ConnectionResult<Record = mixed> = {
  edges: Edge<Record>[],
  pageInfo: PageInfo
}

/**
 * Additional "raw" SQL snippets can be attached to the keyset based on whether they are used in the select where or order
 */
export type SqlConditionParams = {
  select: string[],
  where: string[],
  order: string[]
}

export type KeysetFieldParam = {
  field: string
}

/**
 * @ignore
 */
export type KeysetSerialParam = {
  // field
  f: string,
  // value
  v?: Array<Serializable> | Serializable,
  // descending
  d?: boolean,
  // null
  n?: boolean,
  // search query
  q?: string
}

/**
 * A compact version of the keyset for serialization
 * @ignore
 */
export type KeysetSerialized = {
  // seek
  s: KeysetSerialParam[],
  // filter in
  f: KeysetSerialParam[],
  // where
  w: KeysetSerialParam[],
  // filter intersecrt
  i: KeysetSerialParam[],
  // filter null
  n: KeysetSerialParam[]
}

export type AfterOrBefore = 'after' | 'before'
