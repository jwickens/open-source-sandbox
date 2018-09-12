/**
 * @flow
 */

import * as React from 'react'
import TestRenderer from 'react-test-renderer'
import RasaNluModel from '../RasaNluModel'

describe('RasaNluModel', () => {
  test('Can create a named model', async () => {
    const MyModel = RasaNluModel.create('my-model')
    const IntentA = MyModel.createIntent('my-intent-a')
    const IntentB = MyModel.createIntent('my-intent-b')
    const AnEntity = MyModel.createEntity('my-type')
    const seedData = <React.Fragment>
      <IntentA>
        <d>hi</d>
        <d>hi there</d>
        <d>hello <AnEntity>bob</AnEntity></d>
      </IntentA>
      <IntentB>
        <d>bye</d>
        <d>byw now</d>
        <d>cya <AnEntity>bob</AnEntity></d>
      </IntentB>
    </React.Fragment>
    const data = MyModel._makeData(seedData)
    expect(data.common_examples.length).toBe(6)
    await MyModel.seed(seedData)
    // await promise
    const promises = []
    const addPromise = (p) => promises.push(p)
    // console.log('hi')
    const m = <MyModel input={'hi'} async={addPromise} />
    // const TestInstance = TestRenderer.create(<a>b</a>)
    const TestInstance = TestRenderer.create(m)
    await Promise.all(promises)
    const output = await TestInstance.root.instance.state.output
    expect(output.intent.name).toBe('my-intent-a')
  }, 100000)
})