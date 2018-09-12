/**
 * @flow
 */

// eslint-disable-next-line no-unused-vars
import * as React from 'react'
import { withConfidence } from '../../contexts/Response'
import { AsyncProvider } from '../../contexts/Async'
import TestRenderer from 'react-test-renderer'
import BestResponse from '../BestResponse'
import FirstResponse from '../FirstResponse'

test('BestResponse', async () => {
  const High = withConfidence(0.9, <say>Expected to render</say>)
  const Low = withConfidence(0.2, <say>Error if rendered</say>)
  const promises = []
  const testRenderer = TestRenderer.create(
    <AsyncProvider value={p => { promises.push(p) }}>
      <BestResponse>
        <Low />
        <High />
      </BestResponse>
    </AsyncProvider>
  )
  expect(testRenderer.toJSON()).toBe(null)
  const testInstance = testRenderer.root
  await Promise.all(promises)
  testInstance.find(e => e.children && e.children[0] === 'Expected to render')
})

test('FirstResponse', async () => {
  const High = withConfidence(0.9, <say>Error if rendered</say>)
  const Low = withConfidence(0.2, <say>Expected to render</say>)
  const Zero = withConfidence(0.0, <say>Error if rendered</say>)
  const promises = []
  const testRenderer = TestRenderer.create(
    <AsyncProvider value={p => { promises.push(p) }}>
      <FirstResponse>
        <Zero />
        <Low />
        <High />
      </FirstResponse>
    </AsyncProvider>
  )
  expect(testRenderer.toJSON()).toBe(null)
  const testInstance = testRenderer.root
  await Promise.all(promises)
  testInstance.find(e => e.children && e.children[0] === 'Expected to render')
})

test('FirstResponse with evaluateFrom', async () => {
  const High = withConfidence(0.9, <say>Expected to render</say>)
  const Low = withConfidence(0.2, <say>Error if rendered</say>)
  const Zero = withConfidence(0.0, <say>Error if rendered</say>)
  const promises = []
  const testRenderer = TestRenderer.create(
    <AsyncProvider value={p => { promises.push(p) }}>
      <FirstResponse evaluateFrom={2}>
        <Zero />
        <Low />
        <High />
      </FirstResponse>
    </AsyncProvider>
  )
  expect(testRenderer.toJSON()).toBe(null)
  const testInstance = testRenderer.root
  await Promise.all(promises)
  testInstance.find(e => e.children && e.children[0] === 'Expected to render')
})
