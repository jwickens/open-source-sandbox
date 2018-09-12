/**
 * The Next Element registers its children using the Next context
 * @flow
 */

import * as React from 'react'
import { asNextConsumer } from '../contexts/Next'
import type { Next } from '../contexts/next'
import { register } from '../'

type Props = {
  next: Next,
  children: React.Node
}

class NextComponent extends React.Component<Props> {
  componentDidMount () {
    this.props.next.set(this.props.children)
  }
  render () {
    return null
  }
}

const WrappedNext = asNextConsumer(NextComponent)
Object.defineProperty(WrappedNext, 'name', {value: 'ReactBotNext', writable: false})
register(WrappedNext)

export default WrappedNext
