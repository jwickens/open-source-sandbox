/**
 * @flow
 */

import type { WatsonWorkspace } from './types'
import {
  parents,
  getNodeChildrenContainerName,
  getAllChildrenForNode,
  functionalComponent,
  properCase,
  getAllSiblingGroups,
  siblingGroupContainer,
  nodeToCode,
  standardNodeAsTag,
  intentToDeclaration,
  entityToDeclaration
} from './utils'
import path from 'path'
import prettier from 'prettier'

export type EntityFeature = {
  start: number,
  end: number,
  value: string,
  entity: string
}
type CommonExample = {
  text: string,
  intent: string,
  entities?: EntityFeature[]
}
type EntitySynonym = { value: string, synonyms: string[] }
type RegexFeature = { name: string, pattern: string }
type TrainingData = {
  common_examples: CommonExample[],
  regex_features: RegexFeature[],
  entity_synonyms: EntitySynonym[]
}

type WatsonTransformerParams = {
  cwd: string,
  writeLocation: string,
  workspaceFile: string,
  rasaModelName: string
}

class WatsonTransformer {
  workspace: WatsonWorkspace
  params: WatsonTransformerParams
  constructor (params: WatsonTransformerParams) {
    this.params = params
  }
  load () {
    const filePath = path.resolve(this.params.cwd, this.params.workspaceFile)
    // $FlowFixMe
    this.workspace = require(filePath)
    // do some verification
    const title = {}
    this.workspace.dialog_nodes.forEach(node => {
      if (node.title) {
        if (title[node.title]) {
          throw new Error(`Node titles must be unique for transformation: ${node.title} was repeated`)
        }
        title[node.title] = true
      }
    })
  }
  parse () {
    return {
      rasa: this.parseWorksaceToRasa(),
      code: prettier.format(this.parseWorkspaceToReactBot(), {
        printWidth: 120,
        parser: 'babylon',
        semi: false,
        singleQuote: true
      })
    }
  }
  parseWorkspaceToReactBot () {
    return `
      ${this.headerComment()}
      ${this.imports()}
      ${this.watsonEmulatorDeclaration()}
      ${this.propsType()}
      ${this.botCode()}
      ${this.exportBot()}
    `
  }

  headerComment (): string {
    return `
      /**
      * ${this.workspace.description}
      * @flow
      */
    `
  }

  imports (): string {
    return `
      import * as React from 'react'
      import { WatsonEmulator, Sequential, register, Next } from '../../src/react-bot'
    `
  }

  modelDeclaration (): string {
    let model = `const Model = new RasaNluModel('${properCase(this.workspace.name)}')`
    const intents = this.workspace.intents
    if (intents.length > 0) {
      model += '\n' + intents.map(intentToDeclaration).join('\n')
    }
    const entities = this.workspace.entities
    if (entities.length > 0) {
      model += '\n' + entities.map(entityToDeclaration).join('\n')
    }
    return model
  }

  watsonEmulatorDeclaration (): string {
    return `
      const Watson = new WatsonEmulator({
        workspaceFile: require.resolve('./${this.params.workspaceFile}'),
        rasaModel: '${this.params.rasaModelName}'
      })
    ` 
  }

  propsType (): string {
    return `type Props = {
      evaluateFrom?: number,
      children?: React.Node,
      bypassCondition?: boolean
    }`
  }

  botCode (): string {
    const siblingGroups = getAllSiblingGroups(this.workspace)
    return siblingGroups.map(group => {
      let groupName
      if (group[0].parent) {
        const parent = this.workspace.dialog_nodes.find(n => n.dialog_node === group[0].parent)
        if (!parent) throw new Error(`expected to find parent for node ${group[0].dialog_node}`)
        groupName = getNodeChildrenContainerName(parent)
      } else {
        groupName = properCase(this.workspace.name)
      }
      const container = siblingGroupContainer(groupName, group)
      const members = group
        .map(n => nodeToCode(n, this.workspace))
        .join('\n\n')

      return `
        ${container}

        ${members}
      `
    }).join('\n\n')

  }

  exportBot (): string {
    return `export default ${properCase(this.workspace.name)}`
  }

  parseWorksaceToRasa (): TrainingData {
    // convert intents
    // eslint-disable-next-line camelcase
    const common_examples = []
    this.workspace.intents.forEach(intent => {
      intent.examples.forEach(example => {
        common_examples.push({
          intent: intent.intent,
          text: example.text
        })
      })
    })

    // convert entities
    // probably will use a js class for this
    // eslint-disable-next-line camelcase
    const entity_synonyms = []
    this.workspace.entities.forEach(entity => {
      entity.values.forEach(value => {
        if (value.type === 'synonyms') {
          entity_synonyms.push({
            value: value.value,
            synonyms: value.synonyms
          })
        }
      })
    })
    return {
      common_examples,
      entity_synonyms,
      regex_features: []
    }
  }
}

export default WatsonTransformer
