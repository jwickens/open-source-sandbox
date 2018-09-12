/**
 * @flow
 */

import * as React from 'react'
import { asAsyncConsumer } from '../contexts/Async'
import type { Async } from '../contexts/Async'
import { ResponseProvider } from '../contexts/Response'

type Props = {
  async: Async,
  children: React.Node
}

class BestResponse extends React.Component<Props> {
  constructor (props: Props) {
    super(props)
    this.responses = []
  }

  componentDidMount () {
    this.props.async(this.calculateBestResponse())
  }

  responses: Array<Promise<{confidence: number, cb: () => any}>>

  handleRegister = (promise: Promise<number>, cb: () => any) => {
    const wrapConfidenceAndCallback = async () => ({
      confidence: await promise,
      cb
    })
    this.responses.push(wrapConfidenceAndCallback())
  }

  async calculateBestResponse () {
    const values = await Promise.all(this.responses)
    const best = indexOfMax(values.map(v => v.confidence))
    if (best === -1) return best
    else {
      // notify the child that they should render
      values[best].cb()
      return values[best].confidence
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

export default asAsyncConsumer(BestResponse)

// cant use Math.Max sience we need the index to know the callback to use...
function indexOfMax (arr) {
  if (arr.length === 0) {
    return -1
  }
  var max = arr[0]
  var maxIndex = 0

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i
      max = arr[i]
    }
  }
  return maxIndex
}
