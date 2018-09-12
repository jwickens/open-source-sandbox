/**
 * @flow
 */
import * as React from 'react'

type Props = {
  confidence: number,
  children: React.Node
}

class DefaultResponse extends React.Component<Props> {
  static evaluate (props: Props) {
    return typeof props.confidence === 'number'
      ? props.confidence
      : 0.5
  }
  render () {
    const shouldRender = DefaultResponse.evaluate(this.props)
    if (shouldRender) {
      return <React.Fragment>{this.props.children}</React.Fragment>
    } else {
      return null
    }
  }
}

export default DefaultResponse
