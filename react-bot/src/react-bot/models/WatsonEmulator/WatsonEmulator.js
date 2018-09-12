/**
 * @flow
 */

import * as React from 'react'
import Model from './WatsonModel'
import Condition from './WatsonCondition'
import Session from './WatsonSession'
import Value from './WatsonValue'
import type { WatsonWorkspace } from '../../../react-bot-from-watson/types'

type Params = {
  workspaceFile: string,
  rasaModel: string
}

export default class WatsonEmulator {
  params: Params
  Model: *
  Condition: *
  Context: *
  Session: *
  Value: *
  workspace: WatsonWorkspace
  constructor (params: Params) {
    this.params = params
    this.Context = React.createContext()
    this.Model = Model.bindParent(this)
    this.Condition = Condition.bindParent(this)
    this.Session = Session.bindParent(this)
    this.Value = Value.bindParent(this)
    // $FlowFixMe
    this.workspace = require(this.params.workspaceFile)
  }
}
