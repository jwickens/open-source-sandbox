/**
 * A Response Provider that chooses the first non-zero response
 * @flow
 */

import * as React from 'react'
import { asAsyncConsumer } from '../contexts/Async'
import type { Async } from '../contexts/Async'
import { ResponseProvider } from '../contexts/Response'

type Props = {
  async: Async,
  evaluateFrom?: number,
  children: React.Node
}

class FirstResponse extends React.Component<Props> {
  constructor (props: Props) {
    super(props)
    this.responses = []
  }

  componentDidMount () {
    this.props.async(this.calculateFirstResponse())
  }

  responses: Array<Promise<{confidence: number, cb: () => any}>>

  handleRegister = (promise: Promise<number>, cb: () => any) => {
    const wrapConfidenceAndCallback = async () => ({
      confidence: await promise,
      cb
    })
    this.responses.push(wrapConfidenceAndCallback())
  }

  async calculateFirstResponse () {
    let responses = this.responses
    if (this.props.evaluateFrom) {
      responses = this.responses
        .slice(this.props.evaluateFrom)
        // concat to loop back to beginning
        // actually not desirable default behavior for WatsonTransformer
        // could add as an option later
        // .concat(this.responses.slice(0, this.props.evaluateFrom))
    }
    for (const response of responses) {
      const value = await response
      if (value.confidence > 0) {
        // notify the child that they should render
        value.cb()
        return value.confidence
      }
    }
  }

  render () {
    return (
      <ResponseProvider value={this.handleRegister}>
        {this.props.children}
      </ResponseProvider>
    )
  }
}

export default asAsyncConsumer(FirstResponse)
