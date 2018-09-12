/**
 * @flow
 */

// eslint-disable-Next-line no-unused-vars
import * as React from 'react'
import TestRenderer from 'react-test-renderer'
import { NextProvider } from '../../contexts/Next'
import Delay from '../Delay'
import Next from '../Next'

const SpecifiesNextContent = () => (
  <React.Fragment>
    <say>Expected to render on first pass</say>
    <Next>
      <say>Expected to render on second pass</say>
      <Next>
        <say>Expected to render on third pass</say>
      </Next>
    </Next>
  </React.Fragment>
)

class InfiniteNextLoop extends React.Component {
  render() {
    return (
      <Next>
        <InfiniteNextLoop />
      </Next>
    )
  }
}
let nextElement = null
const nextContext: Next = {
  get: () => Promise.resolve(nextElement),
  set: element => {
    nextElement = element
    return Promise.resolve()
  }
}

function getMessages(element) {
  const testRenderer = TestRenderer.create(<NextProvider value={nextContext}>{element}</NextProvider>)
  const output = testRenderer.toJSON()
  return output && output.children
}

describe('Next', () => {
  test('does not recurse infinitely', () => {
    const testerRenderer = TestRenderer.create(<InfiniteNextLoop />)
  })

  test('provides the content in the correct sequence', () => {
    const A = getMessages(<SpecifiesNextContent />)
    expect(A).toEqual(expect.arrayContaining(['Expected to render on first pass']))
    // $FlowFixMe
    expect(nextElement[0].type).toBe('say')
    const B = getMessages(nextElement)
    expect(B).toEqual(expect.arrayContaining(['Expected to render on second pass']))
    // $FlowFixMe
    expect(nextElement.type).toBe('say')
    const C = getMessages(nextElement)
    expect(C).toEqual(expect.arrayContaining(['Expected to render on third pass']))
  })
})
