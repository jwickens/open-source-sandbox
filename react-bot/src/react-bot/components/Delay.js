/**
 * Delays the children from rendering for a certian amount of time
 * This is mostly for test purposes, for pause in the dialog as content use the wait tag
 * @flow
 */


import * as React from 'react'
import { asAsyncConsumer } from '../contexts/Async'
import type { Async } from '../contexts/Async'

type Props = {children: React.Node, async: Async, time: ?number}
type State = {shouldRender: boolean}

class Delay extends React.Component<Props, State> {
  state = { shouldRender: false }
  componentDidMount () {
    this.props.async(new Promise(resolve => {
      setTimeout(() => {
        resolve()
        this.setState({shouldRender: true})
      }, this.props.time || 200)
    }))
  }
  render () {
    if (this.state.shouldRender) {
      return this.props.children
    } else {
      return null
    }
  }
}

export default asAsyncConsumer(Delay)
