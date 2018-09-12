/**
 * @flow
 * @ignore
 */

/**
 * A row from a db query
 */
export type Row = {
  [key: string]: *,
}

/**
  * A node-pg compatible interface for results from query
  */
export interface ResultSet {
  command: string,
  rowCount: ?number,
  oid?: ?number,
  rows: Array<Row>
}

export type PG_ERROR = {
  name: string,
  length: number,
  severity: string,
  code: string,
  detail?: string,
  hint?: string,
  position?: string,
  internalPosition?: string,
  internalQuery?: string,
  where?: string,
  schema?: string,
  table?: string,
  column?: string,
  dataType?: string,
  constraint?: string,
  file?: string,
  line?: string,
  routine?: string
}

/**
 * Queries can optionally take an object param, which is similar to the pg one for using prepared statements. We also provide options for tuning logging.
 */
export type QueryConfig = {
  name?: string,
  text: string,
  values?: any[],
  logDebug?: boolean | null,
  logError?: boolean
}

/**
 * query function takes either a string or a config object for advanced usage.
 */
export type QueryOptions = string | QueryConfig

export type QueryFunc = (query: QueryOptions) => Promise<ResultSet>
export interface PoolClient {
  +query: QueryFunc,
  +release: Function,
  +on: Function
}

export interface Client {
  +query: QueryFunc,
}

export interface PoolInterface {
  query: QueryFunc,
  connect: () => PoolClient,
  end: () => void
}

/**
 * The logger should support level based logging functions
 */
export type Logger = {
  warn: (msg: string) => void,
  debug: (msg: string) => void,
  error: (msg: string) => void,
  verbose: (msg: string) => void,
  info: (msg: string) => void
}

/**
 * To create the db pass sqlDirectory as the absolute path to your idempotent and migrations files
 */
export type AppDbConstructorParams = {
  logger?: Logger,
  sqlDirectory: string,
  overrideEnv?: boolean
}
