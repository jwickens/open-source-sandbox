/**
 * @flow
 */
import * as React from 'react'
import { asInputConsumer } from '../contexts/Input'

type Props = {
  input: string,
  value: RegExp,
  children: React.Node
}

class Regex extends React.Component<Props> {
  static evaluate (props) {
    const match = props.input.match(props.value)
    if (match) return 1
    return 0
  }
  render () {
    const shouldRender = Regex.evaluate(this.props)
    if (shouldRender) {
      console.log(this.props.children)
      return <React.Fragment>{this.props.children}</React.Fragment>
    } else {
      return null
    }
  }
}

export default Regex
