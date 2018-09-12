/**
 * The response context provides a way for children components to
 * provide different 'confidences' and render conditional on a sibling
 * not having a higher confidence.
 * @flow
 */

import * as React from 'react'
import createAsContextConsumer from './createAsContextConsumer'

// The Respoonse context is a function that takes a promise of the confidence
// and a callback to inform the "winning" child that they had the "best" confidence
export type Response = (p: Promise<number>, cb: () => any) => any

const defaultValue = (p, cb) => {}

export const {
  Provider: ResponseProvider,
  Consumer: ResponseConsumer
} = React.createContext(defaultValue)

export const asResponseConsumer = createAsContextConsumer(ResponseConsumer, 'response')

// conditionally render a component only if it reaches a certain
// this uses a static confidence which is not really useful, this is mostly used in tests
export function withConfidence (confidence: number, element: React.Node) {
  class Confidence extends React.Component<{response: Response}, {canRender: boolean}> {
    componentDidMount () {
      this.props.response(Promise.resolve(confidence), () => {
        this.setState({ canRender: true })
      })
    }
    state = { canRender: false }
    render () {
      if (this.state.canRender) {
        return element
      } else {
        return null
      }
    }
  }
  return asResponseConsumer(Confidence)
}
