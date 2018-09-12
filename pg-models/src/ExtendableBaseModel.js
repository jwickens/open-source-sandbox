/**
 * The ExtendableBaseModel is like the BaseModel except it also provides for instantiating
 * alternative "child models" based on a childModelClassName field
 * @flow
 */

import type { PoolClient } from 'pg'
import type { MinimalFields as BaseModelMinimalFields, RequiredRecordFields, ContextTypeBound } from './BaseModel'
const { BaseModel } = require('./BaseModel')

// In addition the minimal field includes the modelClassName
type MinimalFields = BaseModelMinimalFields & {
  modelClassName: string,
  config: any
}

type RecordTypeBound = MinimalFields & {
  // any other columns you want
  [col: string]: any
}

class ExtendableBaseModel<AppContext: ContextTypeBound, ModelRecord: RecordTypeBound, ParentClass: ExtendableBaseModel<AppContext, ModelRecord, any>> extends BaseModel<AppContext, ModelRecord, ParentClass> {
  // a registry of child models that can be instantiated
  static parent: ?Class<ParentClass>
  static childModels: ?{
    [childName: string]: Class<ParentClass>
  }

  /**
   * Add a child model to the parent model
   */
  static bindChild (child: Class<ParentClass>) {
    class BoundChildModel extends child {
      static parent = this
      static appContext = this.appContext
      static db = this.db
      static table = this.table
    }
    // must have the same name for insertion into db
    Object.defineProperty(BoundChildModel, 'name', {value: child.name})
    this.childModels = {
      ...this.childModels,
      [child.name]: BoundChildModel
    }
  }

  static async create (params: RequiredRecordFields<ModelRecord>, dbClient: ?PoolClient): Promise<ParentClass> {
    if (!this.parent) throw new Error(`Cant call create from parent model ${this.name}, please use one of the child models.`)
    params.modelClassName = this.name
    return super.create(params, dbClient)
  }

  static async _createStoredInstanceFromRecord(record: ModelRecord): Promise<ParentClass> {
    const { modelClassName } = record
    // $FlowFixMe its not you its me
    let Parent: Class<ParentClass> = this
    if (this.parent) {
      Parent = this.parent
    }
    if (!Parent.childModels) throw new Error(`Expected ${this.name} to be a Parent Model`)
    const Child = Parent.childModels[modelClassName]
    if (!Child || typeof Child !== 'function') throw new Error(`${modelClassName} is not a valid child model of ${this.name}`)
    const instance = new Child({record})
    await instance.isInitialized
    return instance
  }
}

module.exports = { ExtendableBaseModel }
