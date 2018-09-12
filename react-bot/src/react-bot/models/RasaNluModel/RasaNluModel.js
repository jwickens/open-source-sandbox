/**
 * @flow
 */

import * as React from 'react'
import request from 'request-promise-native'
import { AsyncConsumer, asAsyncConsumer } from '../../contexts/Async'
import { InputConsumer } from '../../contexts/Input'
import Entity from './RasaNluEntity'
import Intent from './RasaNluIntent'
import type { Async } from '../../contexts/Async'
import type { Input } from '../../contexts/Input'

// these types are determined by the RASA API

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
export type TrainingData = {
  common_examples: CommonExample[],
  regex_features: RegexFeature[],
  entity_synonyms: EntitySynonym[]
}
export type Output = {
  intent: {
    name: string,
    confidence: number
  },
  entities: EntityFeature[]
}

// The value that ModelProvider passes
// through the Consume render prop
export type ModelContext = {
  // predicted intent. The promise resolves when Rasa NLU responds
  output: Promise<Output>,
  // add an element to data
  train: (React.Element<any>) => Promise<any>,
}

// const EMPTY_MODEL_CONTEXT: ModelContext = {
//   output: Promise.reject(new Error('null model context')),
//   train: (element) => Promise.reject(new Error('null model context')),
// }

type ModelProps = {
  async: Async,
  input: Input,
  children?: mixed
}

type ModelState = ModelContext

// fallback datacache
const dataCache: {
  [modelName: string]: TrainingData
} = {}

export class RasaNluModel extends React.Component<ModelProps, ModelState> {
  // the next methods are implementation details
  constructor (props: ModelProps) {
    super(props)
    this.state = {
      output: this.constructor.getOutput(this.props),
      train: this.train.bind(this)
    }
  }
  componentDidUpdate (prevProps: ModelProps, prevState: ModelState) {
    if (prevProps.input !== this.props.input) {
      this.setState({
        output: this.constructor.getOutput(this.props)
      })
    }
  }

  static ModelConsumer: React.ComponentType<any>
  static modelName: string
  static seedData: React.Element<any>
  // statics set by the create method
  static ModelProvider: React.ComponentType<any>

  // override this to get real persistence
  static async getModelData () {
    return dataCache[this.modelName]
  }
  // override this to get real persistence
  static async seedModelData (trainingData: TrainingData) {
    dataCache[this.modelName] = trainingData
  }
  // override this to get real persistence
  static async appendModelData (trainingData: TrainingData) {
    const existingData = await this.getModelData()
    for (const featureType in trainingData) {
      existingData[featureType].push(trainingData[featureType])
    }
    dataCache[this.modelName] = trainingData
  }
  /**
   * The main API entrypoint for users. This creates a model with the given name, which is used for persistence
   * This returns another class which is then used as a React component.
   */
  static create (modelName: string) {
    const {
      Provider,
      Consumer
    } = React.createContext()
    class BoundRasaNluModel extends RasaNluModel {
      static modelName = modelName
      static ModelProvider = Provider
      static ModelConsumer = Consumer
    }
    return asAsyncConsumer(BoundRasaNluModel)
  }
  /**
   * Createa a named intent. The class returned is a react component.
   * It can be used for both matching an intent, and for providing training examples.
   * If used for matching the Model should be an ancestor.
   */
  static createIntent (intentName: string) {
    const { ModelConsumer } = this
    class ModelIntent extends Intent {
      static intentName = intentName
    }
    return ModelIntent
  }
  /**
   * Creates a named entity. The class returned is a react component
   * which can be used for both matching the intent and for providing training exampes.
   * If used for matching the Model should be an ancestor.
   */
  static createEntity (entityName: string) {
    const { ModelConsumer } = this
    class ModelEntity extends Entity {
      static entityName = entityName
      render () {
        return (
          <ModelConsumer>{
            model => <Entity name={entityName} model={model} {...this.props} />
          }</ModelConsumer>
        )
      }
    }
    return ModelEntity
  }
  /**
   * WIP.
   * Provide seed data to the model. This should be done at most once.
   */
  static async seed (element: React.Element<any>) {
    const status = await this.status()
    if (status) return
    const data = this._makeData(element)
    await this.seedModelData(data)
    await this.syncModel()
  }

  static async syncModel () {
    const data = await this.getModelData()
    try {
      await this.train(data)
    } catch (err) {
      if (err.statusCode === 403) console.warn(err.message)
      else throw err
    }
  }
  /**
   * Add a peice of data to the model and retrain. This method is intended to be used
   * by components that provide interactive training.
   */
  async train (element: React.Element<any>) {
    const data = this.constructor._makeData(element)
    console.log(`training data: ${JSON.stringify(data, null, 4)}`)
    await this.constructor.syncModel()
  }

  static getOutput (props: ModelProps) {
    const promise = this.query(props.input)
    props.async(promise)
    return promise
  }

  renderForContext () {
    const { constructor: ModelType } = this
    return (
      <InputConsumer>{(input) => (
        <AsyncConsumer>{(async) => (
          <ModelType {...this.props} input={input} async={async} />
        )}
        </AsyncConsumer>
      )}
      </InputConsumer>
    )
  }
  static _makeData (element: React.Element<any>): TrainingData {
    let children = element.props.children
    if (!Array.isArray(children)) children = [children]
    // eslint-disable-next-line camelcase
    const common_examples = children
      .filter(element => element.type.prototype instanceof Intent)
      .map(intent => intent.type.toData(intent.props))
      .reduce((a, b) => a.concat(b), [])

    return {
      common_examples,
      // todo
      regex_features: [],
      entity_synonyms: []
    }
  }
  static async train (data: TrainingData) {
    console.log(data)
    const config = {
      language: 'en',
      pipeline: 'spacy_sklearn',
      data: {
        rasa_nlu_data: data
      }
    }
    const opts = {
      method: 'POST',
      uri: `http://localhost:5000/train`,
      qs: {
        project: this.modelName
      },
      headers: {
        'content-type': 'application/x-yml'
      },
      body: JSON.stringify(config)
    }
    try {
      await request(opts)
    } catch (err) {
      console.error(`error while training: ${err.message}`)
    }
  }
  static async query (text: string) {
    console.log(text)
    const options = {
      method: 'POST',
      uri: `http://localhost:5000/parse`,
      json: {
        q: text,
        project: this.modelName
      }
    }
    try {
      const response = await request(options)
      return response
    } catch (err) {
      console.error(`error while processing response: ${err.message}`)
      throw err
    }
  }
  static async checkIsReady () {
    const status = await this.status()
    return status.status === 'ready'
  }
  static async status () {
    const response = await request({
      method: 'GET',
      json: true,
      uri: `http://localhost:5000/status`
    })
    // console.log(response)
    const status = response.available_projects[this.modelName]
    return status
  }
  render () {
    console.log('hi model')
    if (!this.props.input || !this.props.async) return this.renderForContext()
    const { ModelProvider } = this.constructor
    return (
      <ModelProvider value={this.state}>
        {this.props.children}
      </ModelProvider>
    )
  }
}
