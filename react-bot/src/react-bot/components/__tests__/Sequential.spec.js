/**
 * @flow
 */

// eslint-disable-next-line no-unused-vars
import * as React from 'react'
import { } from '../../contexts/Response'
import { AsyncProvider } from '../../contexts/Async'
import { SessionProvider } from '../../contexts/Session'
import Sequential from '../Sequential'
import TestRenderer from 'react-test-renderer'
import Redis from 'ioredis-mock'

test('Sequential', async () => {
  const redis = new Redis()
  async function testIt (message) {
    const promises = []
    const testRenderer = TestRenderer.create(
      <AsyncProvider value={p => { promises.push(p) }}>
        <SessionProvider value={{ redis, id: 'test-seq' }}>
          <Sequential>
            <say>Hello</say>
            <say>Hola</say>
            <say>Ciao</say>
          </Sequential>
        </SessionProvider>
      </AsyncProvider>
    )

    const testInstance = testRenderer.root
    await Promise.all(promises)
    testInstance.find(e => e.children && e.children[0] === message)
  }
  await testIt('Hello')
  await testIt('Hola')
  await testIt('Ciao')
})
