/**
 * @flow
 */

import * as React from 'react'
import { asInputConsumer } from '../../contexts/Input'
import type { Input } from '../../contexts/Input'
import type { EntityValue } from '../../../react-bot-from-watson/types'
import type { default as WatsonEmulator } from './WatsonEmulator'
import { asSessionConsumer } from '../../contexts/Session'
import type { Session } from '../../contexts/Session'
import FirstResponse from '../../components/FirstResponse'
import request from 'request-promise-native'
import { register } from '../../'

type Props = {
  children: any,
  session: Session,
  // this is passed onto FirstRespone
  evaluateFrom?: number,
  input: Input
}

export type State = {
  dataState: 'notAsked' | 'loading' | 'success' | 'error',
  output: Promise<{
    welcome: boolean,
    input: {
      text: string
    },
    session: Object,
    entities: {
      [entityName: string]: mixed
    },
    intents: {
      [intentName: string]: number
    },
    anything_else: boolean
  }>
}

const SYS_ENTITIES_RE = /^sys-(.*)/

class WatsonModel extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      dataState: 'notAsked',
      output: this.processInputWithModel()
    }
  }
  static parent: WatsonEmulator
  static bindParent (watson: WatsonEmulator) {
    class BoundWatsonModel extends WatsonModel {
      static parent = watson
    }
    const Model = asInputConsumer(asSessionConsumer(BoundWatsonModel))
    // this prevents us from making the same query twice
    const NestableModel = (props: any) => (
      <watson.Context.Consumer>{value => {
        if (value) {
          return (
            <FirstResponse evaluateFrom={props.evaluateFrom}>
              {props.children}
            </FirstResponse>
          )
        } else {
          return <Model {...props} />
        }
      }}</watson.Context.Consumer>
    )
    Object.defineProperty(NestableModel, 'name', {
      value: 'WatsonModel' + watson.params.rasaModel,
      writable: false
    })
    register(NestableModel)
    return NestableModel
  }
  async processInputWithModel () {
    try {
      const isWelcomed = await this.props.session.redis
        .get(`sessions.${this.props.session.id}.watson-model.welcomed`)
      if (!isWelcomed) {
        await this.props.session.redis
          .set(`sessions.${this.props.session.id}.watson-model.welcomed`, true)
      }
      const entities = await this.findEntities()
      const intents = await this.getIntentsFromRasa()
      const session = await this.getSession()
      this.setState({
        dataState: 'success'
      })
      const watson = {
        welcome: !isWelcomed,
        entities,
        intents,
        session,
        input: {
          text: this.props.input
        },
        anything_else: true
      }
      console.log(watson)
      return watson
    } catch (err) {
      this.setState({
        dataState: 'error'
      })
      throw err
    }
  }

  async getSession () {
    const redisKey = `sessions.${this.props.session.id}.watson_context`
    const previous = await this.props.session.redis.get(redisKey)
    return previous ? JSON.parse(previous) : {}
  }

  async getIntentsFromRasa () {
    const intents = {}
    const response = await this.queryRasa()
    // console.log(response.intent)
    if (response.intent && response.intent.confidence > 0) {
      intents[response.intent.name] = response.intent.confidence
    }
    return intents
  }

  async queryRasa (model: string = this.constructor.parent.params.rasaModel) {
    const { input } = this.props
    const options = {
      method: 'POST',
      uri: `http://localhost:5000/parse`,
      json: {
        q: input,
        project: model
      }
    }
    try {
      const response = await request(options)
      return response
    } catch (err) {
      console.error(`error while processing response with rasa: ${err.message}`)
      throw err
    }
  }
  async querySpacy () {
    const { input } = this.props
    const options = {
      method: 'POST',
      uri: `http://localhost:8000/ent`,
      json: {
        text: input,
        model: 'en'
      }
    }
    try {
      const response = await request(options)
      return response
    } catch (err) {
      console.error(`error while processing response with rasa: ${err.message}`)
      throw err
    }
  }
  async queryDuckling () {
    const { input } = this.props
    const options = {
      method: 'POST',
      uri: `http://localhost:8000/parse`,
      form: {
        locale: 'en_GB',
        text: input
      },
      json: true
    }
    try {
      const response = await request(options)
      return response
    } catch (err) {
      console.error(`error while processing response with rasa: ${err.message}`)
      throw err
    }
  }
  async findEntities () {
    const entities = {}
    const { workspace: { entities: watsonEntities } } = this.constructor.parent
    const promises = watsonEntities.map(async (entity) => {
      const { entity: entityName, values } = entity
      const isSys = SYS_ENTITIES_RE.exec(entityName)
      if (isSys) {
        const sysType = isSys[1]
        entities[entityName] = await this.matchSysEntity(sysType)
      } else {
        entities[entityName] = this.matchValueEntities(values)
      }
    })
    await Promise.all(promises)
    // console.log(entities)
    return entities
  }

  async matchSysEntity (sysType: 'number') {
    if (sysType === 'number') {
      const response = await this.queryDuckling()
      for (const match of response) {
        if (match.dim === 'number') {
          return match.value.value
        }
      }
    }
  }

  matchValueEntities (values: EntityValue[]) {
    const { input } = this.props
    for (const value of values) {
      let matchingElements
      if (value.type === 'synonyms') {
        // note that this ignores fuzzy-matching option
        matchingElements = value.synonyms.map(s => {
          return new RegExp('\\b' + s + '\\b', 'i')
        })
      } else {
        // else a regex pattern
        matchingElements = value.patterns.map(p => {
          return new RegExp(p)
        })
      }
      for (const pattern of matchingElements) {
        if (pattern.exec(input)) {
          return value.value
        }
      }
    }
  }

  render () {
    const { Context } = this.constructor.parent
    return (
        <Context.Provider value={this.state}>
          <FirstResponse evaluateFrom={this.props.evaluateFrom}>
            {this.props.children}
          </FirstResponse>
        </Context.Provider>
    )
  }
}

export default WatsonModel
