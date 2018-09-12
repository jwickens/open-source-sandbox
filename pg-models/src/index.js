// @flow

export type { MinimalFields } from './BaseModel'

const { BaseModel } = require('./BaseModel')
const { ExtendableBaseModel } = require('./ExtendableBaseModel')

module.exports = {
  ExtendableBaseModel,
  BaseModel
}
