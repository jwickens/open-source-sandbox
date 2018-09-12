/**
 * @flow
 */

import * as React from 'react'

type IntentProps = {
  model?: ModelContext,
  children: Array<React.Element<any> | React.Element<any>>
}

export default class Intent extends React.Component<IntentProps> {
  static intentName: string
  static ModelConsumer: React.ComponentType<any>
  static toData (props: IntentProps): CommonExample[] {
    let children = props.children
    if (!Array.isArray(children)) children = [children]
    return children
      .filter(c => c.type === 'd')
      .map(({props}) => {
        const example = {
          intent: this.intentName,
          text: d.toText(props)
        }
        const entities = d.toEntities(props)
        // $FlowFixMe
        if (entities.length > 0) example.entities = entities
        return example
      })
  }
  renderForContext () {
    const IntentClass = this.constructor
    const { ModelConsumer } = IntentClass
    return (
      <ModelConsumer>{
        model => <IntentClass model={model} {...this.props} />
      }</ModelConsumer>
    )
  }
  render () {
    if (!this.props.model) return this.renderForContext()
    return this.props.children
  }
}
