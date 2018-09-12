/**
 * @flow
 */
import * as React from 'react'
import { asAsyncConsumer } from '../contexts/Async'
import type { Async } from '../contexts/Async'
import { asSessionConsumer } from '../contexts/Session'
import type { Session } from '../contexts/Session'
import { hashElement } from '../serialization'

type Props = {
  session: Session,
  async: Async,
  children: React.Node[]
}

type State = {
  currentChild?: React.Node
}

class Sequential extends React.Component<Props, State> {
  componentDidMount () {
    this.props.async(this.getCurrentChild())
  }
  state = {}
  async getCurrentChild () {
    const hash = hashElement(this.props.children)
    let currentIndex = 0
    // if this fails fallback to first child
    try {
      const previous = await this.props.session.redis.get(`sessions.${this.props.session.id}.sequential.${hash}`)
      const redisIndex = parseInt(previous, 10)
      if (!isNaN(redisIndex)) {
        currentIndex = redisIndex
      }
      const nextValue = currentIndex + 1
      await this.props.session.redis.set(`sessions.${this.props.session.id}.sequential.${hash}`, nextValue)
    } catch (error) {
      console.error(error)
    }
    const currentChild = this.props.children[currentIndex]
    this.setState({ currentChild })
  }
  render () {
    const { currentChild } = this.state
    if (currentChild) {
      return currentChild
    } else {
      return null
    }
  }
}

export default asSessionConsumer(asAsyncConsumer(Sequential))
