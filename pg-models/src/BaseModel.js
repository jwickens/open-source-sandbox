/**
 * @flow
 */

import type { Keyset, Db, PoolClient, Table } from 'pg'

const { OrgScopedTable } = require('pg')
const { isEqual, cloneDeep } = require('lodash')
const { SQL } = require('sql-template-strings')

export type SqlStatement = SQL | string
type BaseModelConstructorParams<Record> = {
  record: Record
}

// The record type must have at least these columns
export type MinimalFields = {
  id: string,
  organizationId: string,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: ?Date
}

type RecordTypeBound = MinimalFields & {
  // any other columns you want
  [col: string]: any
}

// this type may not handle all cases, but it will catch specifying wrong ones
// organizationId must be provided
export type RequiredRecordFields<ModelRecord> =
  $Shape<ModelRecord> & { organizationId: string }

// the context must have at least a db
export type ContextTypeBound = {
  db: Db
  // also should have a table instance see bindAppContext below
}

/**
 * This class is abstract and should be overriden and implement some behaviorals
 * Your context should have a OrgScopedTable named myModelTable or you must override getMyTableFromContext
 * Three admissions of overkill:
 * * you must pass in a Record type which is actually available in the OrgScopedTable
 * * you must pass in the class itself so that flow understands your behaviorals
 * * the bound on the class passed in is slightly recursive (see generic signature) because we need flow to know that the class returned is an extended version of BaseModel
 * We currently dont have good ways to make these not required
 * @example
 * class MyModel extends BaseModel<MyAppContext, MyModelRecord, MyModel> {
 *   myBehavioral () {
 *   }
 * }
 */
class BaseModel<AppContext: ContextTypeBound, ModelRecord: RecordTypeBound, ModelClass: BaseModel<AppContext, ModelRecord, any>> {
  static appContext: AppContext
  static table: OrgScopedTable<AppContext, ModelRecord> | Table
  static db: Db
  static overriddenTableName: ?string
  static tableName: ?string
  static tableType: ?string
  db: Db
  table: OrgScopedTable<AppContext, ModelRecord> | Table
  appContext: AppContext
  storedRecord: ModelRecord
  currentRecord: ModelRecord
  isInitialized: Promise<boolean>

  constructor (params: BaseModelConstructorParams<ModelRecord>) {
    const { record } = params
    if (!this.constructor.appContext) throw new Error(`must be called after custom bind method`)
    this.currentRecord = record
    this.storedRecord = cloneDeep(record)
    this.isInitialized = this.initialize()
    this.db = this.constructor.db
    this.table = this.constructor.table
    this.appContext = this.constructor.appContext
  }

  /**
   * This method must be called in your app initialization to wrap
   * your unconnected models with a new class that has db, table, and appContext
   * as static props.
   *
   * Note: this assumes your instantiated table is named like
   * "myModelTable." inside of appContext
   *
   * If this is not the case set overriddenTableName in your class def.
   */
  static bindAppContext (appContext: AppContext): Class<ModelClass> {
    const db = appContext.db
    if (!db) throw new Error(`${appContext.constructor.name} should have db`)
    let table
    // if tableName is specified, actually create a new table object.
    if (this.tableName) {
      if (this.tableType === 'orgScoped') {
        table = new OrgScopedTable(appContext, this.tableName)
      } else {
        // default to normal Table
        table = db.getTable(this.tableName)
      }
    } else {
      const instantiatedTableName = this.overriddenTableName || `${this.name.slice(0, 1).toLowerCase()}${this.name.slice(1)}Table`
      table = appContext[instantiatedTableName]
      if (!table) throw new Error(`${appContext.constructor.name} should have ${instantiatedTableName}`)
    }
    class BoundModel extends this {
      static db = db
      static table = table
      static appContext = appContext
    }
    // make the name more sensible for logs
    Object.defineProperty(BoundModel, 'name', {value: `${appContext.constructor.name}Bound(${this.name})`})
    // $FlowFixMe cheap typecast down to ModelClass
    return BoundModel
  }

  static async create (params: RequiredRecordFields<ModelRecord>, dbClient: ?PoolClient): Promise<ModelClass> {
    params.updatedAt = new Date()
    params.createdAt = new Date()
    // $FlowFixMe Row from normal table (not type safe like OrgScopedTable)
    const record = await this.table.insertRecord(params, dbClient)
    return this._createStoredInstanceFromRecord(record)
  }

  static async getByIdAndOrg(id: string, orgId: string, dbClient: ?PoolClient) {
    return this.getOneWhere(
      SQL`id = ${id} AND organization_id = ${orgId} AND deleted_at is NULL`,
      dbClient
    )
  }

  static async getById(id: string, dbClient: ?PoolClient): Promise<ModelClass> {
    return this._getOneWhere(SQL`id = ${id} AND deleted_at is NULL`, dbClient)
  }

  // all the benefits of ORM with the benefit of an upsert in a single transaction
  // (see implementation at OrgScopedTable)
  static async getByUpsert (record: RequiredRecordFields<ModelRecord>, dbClient: ?PoolClient): Promise<{result: ModelClass, prev: ?ModelClass}> {
    const { prev, result } = await this.table.upsertRecord(record, dbClient)
    let prevRuntime
    if (prev && prev.id && prev.modelClassName) {
      prevRuntime = await this._createStoredInstanceFromRecord(prev)
      // set the 'storedRecord' to whats actually in db
      prevRuntime.storedRecord = result.storedRecord
    }
    return {
      prev: prevRuntime,
      result: await this._createStoredInstanceFromRecord(result)
    }
  }

  // get a paginated list of models following graphql shape
  // except node is the model instead of a data record.
  static async getByKeyset (keyset: Keyset, dbClient: ?PoolClient) {
    // $FlowFixMe hopefully this gives us what we expected
    const result = await keyset.query()
    return {
      ...result,
      edges: await Promise.all(result.edges
        .map(async ({node, ...restEdge}) => ({
          ...restEdge,
          node: await this._createStoredInstanceFromRecord(node)
        }))
      )
    }
  }

  static async _getById(id: string, dbClient: ?PoolClient) {
    // $FlowFixMe table returns a generic row too bad
    const record = await this.table.getById(id, dbClient)
    return this._createStoredInstanceFromRecord(record)
  }

  static async getOneWhere(sqlWhereQuery: SqlStatement, dbClient: ?PoolClient): Promise<ModelClass> {
    return this._getOneWhere(
      SQL`deleted_at is NULL AND `.append(sqlWhereQuery),
      dbClient
    )
  }

  static async _getOneWhere(sqlWhereQuery: SqlStatement, dbClient: ?PoolClient): Promise<ModelClass> {
    const query = SQL`SELECT * FROM `
      .append(this.table.name)
      .append(SQL` WHERE `)
      .append(sqlWhereQuery)
    const record: ModelRecord =
      // $FlowFixMe
      await this.db.one(query, dbClient)

    return this._createStoredInstanceFromRecord(record)
  }

  // TODO: the ***ManyWhere functions are not orgScoped
  // should allow developers to do both
  static async getManyWhere(sqlWhereQuery: SqlStatement, dbClient: ?PoolClient): Promise<Array<ModelClass>> {
    return this._getManyWhere(
      SQL`deleted_at is NULL AND `.append(sqlWhereQuery),
      dbClient
    )
  }

  static async _getManyWhere(sqlWhereQuery: SqlStatement, dbClient: ?PoolClient): Promise<Array<ModelClass>> {
    const query = SQL`SELECT * FROM `
      .append(this.table.name)
      .append(SQL` WHERE `)
      .append(sqlWhereQuery)
    // $FlowFixMe db returns a generic row too bad
    const records = await this.db.find(query, dbClient)
    const modelInstances = records.map(record => {
      return this._createStoredInstanceFromRecord(record)
    })
    const models = await Promise.all(modelInstances)
    return models
  }

  static async _createStoredInstanceFromRecord(record: ModelRecord): Promise<ModelClass> {
    // $FlowFixMe its not you its me
    const instance = new this({record})
    await instance.isInitialized
    return instance
  }

  isDirty() {
    // TODO implement immutable principle for faster check
    return !isEqual(this.currentRecord, this.storedRecord)
  }

  // this method can be overriden to include one-time async setup
  async initialize () {
    return true
  }

  async save(dbClient?: ?PoolClient) {
    // Note: if storedRecord is same as currentRecord. Simply updating the updatedAt
    if (this._idChanged()) {
      const msg =
        `can't change the id of a model instance then save it.` +
        ` Create new model instance if you want a new id`
      throw new Error(msg)
    }
    let idToUse // this may very well stay undefined
    if (this.currentRecord.id && !this.storedRecord) {
      // developer is setting id to a new object and upserting it.
      idToUse = this.currentRecord.id
    } else if (this.storedRecord && this.storedRecord.id) {
      idToUse = this.storedRecord.id
    }

    if (idToUse) {
      this.currentRecord.id = idToUse
    }
    this.currentRecord.updatedAt = new Date()
    const { result: storedRecord } = await this.table.upsertRecord(
      this.currentRecord,
      dbClient
    )
    this.storedRecord = storedRecord
    this.currentRecord = cloneDeep(this.storedRecord)

    return this
  }

  _idChanged () {
    return this.currentRecord.id &&
      this.storedRecord &&
      this.currentRecord.id !== this.storedRecord.id
  }

  async delete (dbClient?: PoolClient) {
    if (this.isDirty()) {
      throw new Error(
        `Cannot delete dirty record. Make sure to make no unsaved changes before deleting`
      )
    } else if (this.storedRecord.deletedAt === undefined) {
      // null is valid
      throw new Error(
        `Model ${
          this.constructor.name
        } doesn't have a deletedAt field. Either migrate the model or use "destroy" to remove entry`
      )
    }
    this.currentRecord.deletedAt = new Date()
    return this.save(dbClient)
  }

  async destroy (dbClient?: PoolClient) {
    if (this.isDirty()) {
      throw new Error(
        `Cannot delete dirty record. Make sure to make no unsaved changes before deleting`
      )
    }
    await this.table.deleteRecord(this.storedRecord, dbClient)
    delete this.storedRecord
    return null
  }
}

module.exports = {
  BaseModel
}
