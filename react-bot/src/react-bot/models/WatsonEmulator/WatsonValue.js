/**
 * @flow
 */

import * as React from 'react'
import { asAsyncConsumer } from '../../contexts/Async'
import type { Async } from '../../contexts/Async'
import { asSessionConsumer } from '../../contexts/Session'
import type { Session } from '../../contexts/Session'
import type { default as WatsonEmulator } from './WatsonEmulator'
import type { State as Model } from './WatsonModel'
import { getValueWithKey } from './utils'

type Props = {
  for: string,
  model: Model,
  session: Session,
  async: Async,
  children?: (value: string) => React.Node 
}

type State = {
  value: ?string
}

class WatsonValue extends React.Component<Props, State> {
  state = { value: null }
  componentDidMount () {
    this.props.async(this.getValue())
  }
  parent: WatsonEmulator
  static bindParent (watson: WatsonEmulator) {
    class BoundWatsonValue extends WatsonValue {
      parent = watson
    }
    const WatsonValueWithModel = (props: {for: string, async: Async, session: Session}) => (
      <watson.Context.Consumer>{
        model => <BoundWatsonValue {...props} model={model} />
      }</watson.Context.Consumer>
    )
    return asSessionConsumer(asAsyncConsumer(WatsonValueWithModel))
  }
  async getValue () {
    if (!this.props.for) {
      return console.error(`props "for" must be provided to Watson.Value`)
    }
    const key = this.props.for
    const value = await getValueWithKey(key, this.props)
    // $FlowFixMe this should be a string, otherwise react should coerce
    this.setState({value})
  }
  render () {
    if (this.state.value) {
      if (typeof this.props.children === 'function') {
        return this.props.children(this.state.value)
      }
      return this.state.value
    } else {
      return null
    }
  }
}

export default WatsonValue