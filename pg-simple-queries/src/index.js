/**
 * @flow
 * @ignore
 */

const Db = require('./Db')
const Table = require('./Table')
const Keyset = require('./Keyset')
const PsqlWrapper = require('./PsqlWrapper')
const MigrationTester = require('./MigrationTester')
const MigrationHelper = require('./MigrationHelper')
const OrgScopedTable = require('./OrgScopedTable')

const errors = require('./errors')
const utils = require('./util')

module.exports = {
  // for es6 imports
  default: Db,
  Db,
  Table,
  Keyset,
  PsqlWrapper,
  OrgScopedTable,
  MigrationTester,
  MigrationHelper,
  ...errors,
  ...utils
}

export type {
  Client,
  Logger,
  PoolInterface,
  QueryConfig,
  QueryOptions,
  PoolClient,
  ResultSet,
  Row
} from './Db.types.js'

export type {
  SqlFile,
  MigrationsInfo
} from './MigrationHelper.types.js'

export type {
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
