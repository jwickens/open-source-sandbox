/**
 * @flow
 */

import * as React from 'react'
import { asInputConsumer } from '../../contexts/Input'
import { asSessionConsumer } from '../../contexts/Session'
import type { Session } from '../../contexts/Session'
import { asAsyncConsumer } from '../../contexts/Async'
import type { Async } from '../../contexts/Async'
import type { default as WatsonEmulator } from './WatsonEmulator'
import type { State as Model } from './WatsonModel'
import { getValueWithKey } from './utils'

type Props = {
  model: Model,
  async: Async,
  session: Session,
  set: {
    [key: string]: string
  }
}

type State = {
  shouldRender: boolean
}

class WatsonSession extends React.Component<Props, State> {
  parent: WatsonEmulator
  state = { shouldRender: false }
  static bindParent (watson: WatsonEmulator) {
    class BoundWatsonSession extends WatsonSession {
      parent = watson
    }
    const WatsonSessionWithModel = (props: Props) => (
      <watson.Context.Consumer>{
        model => <BoundWatsonSession {...props} model={model} />
      }</watson.Context.Consumer>
    )
    return asAsyncConsumer(asSessionConsumer(WatsonSessionWithModel))
  }
  componentDidMount () {
    this.props.async(this.setValue())
  }
  async setValue () {
    const output = await this.props.model.output
    const redisKey = `sessions.${this.props.session.id}.watson_context`
    let previous = await this.props.session.redis.get(redisKey)
    if (previous) { previous = JSON.parse(previous) }
    const nextValue = {...previous}
    for (const prop in this.props.set) {
      const key = this.props.set[prop]
      let value
      if (key.match(/\$|\@/)) {
        value = await getValueWithKey(key, this.props)
      } else {
        value = key
      }
      nextValue[prop] = value
    }
    // console.log(`setting value: ${JSON.stringify(nextValue)} with ket: ${redisKey}`)
    await this.props.session.redis.set(redisKey, JSON.stringify(nextValue))
    this.setState({shouldRender: true})
  }
  render () {
    // $FlowFixMe
    if (this.state.shouldRender) return this.props.children || null
    else return null
  }
}

export default WatsonSession