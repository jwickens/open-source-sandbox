/**
 * @flow
 */
import * as React from 'react'
import type { default as WatsonEmulator } from './WatsonEmulator'
import { asInputConsumer } from '../../contexts/Input'
import { asResponseConsumer } from '../../contexts/Response'
import type { Response } from '../../contexts/Response'
import type { State as ModelOutput } from './WatsonModel'
import FirstResponse from '../../components/FirstResponse'

type Watson = {}
type Props = {
  input: string,
  response: Response,
  bypass?: boolean,
  match: (Watson) => boolean,
  children: React.Node
}

type State = {
  shouldRespond: boolean
}

class WatsonCondition extends React.Component<Props & {model: ModelOutput}, State> {
  componentDidMount () {
    this.props.response(this.evaluate(), () => {
      this.setState({ shouldRespond: true })
    })
  }

  static parent: WatsonEmulator
  state = { shouldRespond: false }

  static bindParent (watson: WatsonEmulator) {
    class BoundWatsonCondition extends WatsonCondition {
      static parent = watson
    }
    const WatsonConditionWithModel = (props: Props) => (
      <watson.Context.Consumer>{
        model => <BoundWatsonCondition {...props} model={model} />
      }</watson.Context.Consumer>
    )
    return asInputConsumer(asResponseConsumer(WatsonConditionWithModel))
  }

  async evaluate () {
    if (this.props.bypass) return 1
    const match = await this.props.match(await this.props.model.output)
    if (match) return 1
    return 0
  }

  render () {
    if (this.state.shouldRespond || this.props.bypass) {
      // also enable children to be conditions
      return (
        <FirstResponse>
          {this.props.children}
        </FirstResponse>
      )
    } else {
      return null
    }
  }
}

export default WatsonCondition
