/**
 * @flow
 */
import * as React from 'react'
import Redis from 'ioredis'
import {
  deserializeElement,
  serializeElement
} from './serialization'
import { AsyncProvider } from './contexts/Async'
import { SessionProvider } from './contexts/Session'
import { InputProvider } from './contexts/Input'
import { NextProvider } from './contexts/Next'
import TestRenderer from 'react-test-renderer'
import ReactElementToString from 'react-element-to-string'

class ReactBot {
  rootElement: React.Element<any>
  redis: Redis

  constructor (botElement: React.Element<any>, id: string) {
    if (!botElement || !botElement.type) throw new Error('First argument must be a (composite) speech element. Perhaps you forgot to use to express it as JSX.')
    if (!id) throw new Error('Second argument must be an id for your bot.')
    this.rootElement = botElement
    this.redis = new Redis({ keyPrefix: `react_bot:${id}:` })
  }

  /**
   * Have the bot process a message with the given session id
   * The most frequent used API method, besides the constructor.
   */
  async message (sessionId: string, text: string) {
    let nextElement = await this.getNextElement(sessionId)
    if (!nextElement) nextElement = this.rootElement
    console.log(`for input "${text}", using next element ${ReactElementToString(nextElement)}`)
    const awaitables = []
    const awaitSomething = (p: Promise<any>) => { awaitables.push(p) }
    const nextContext = {
      set: (element) => this.setNextElement(sessionId, element),
      get: () => this.getNextElement(sessionId)
    }
    const wrappedEle = (
      <NextProvider value={nextContext}>
        <InputProvider value={text}>
          <SessionProvider value={{ id: sessionId, redis: this.redis }}>
            <AsyncProvider value={awaitSomething}>
              {nextElement}
            </AsyncProvider>
          </SessionProvider>
        </InputProvider>
      </NextProvider>
    )
    const renderer = TestRenderer.create(wrappedEle)
    await promiseAllStable(awaitables)
    const result = renderer.toJSON()
    return cleanResult(result)
  }

  /**
   * Remove a session from the store. This cannot be undone
   */
  async clearSession (sessionId: string) {
    // onlt deletes next
    await this.redis.del(`sessions.${sessionId}.next`)
  }

  async activateLink (sessionId: string, link: string) {
  }

  async getNextElement (sessionId: string): Promise<React.Node> {
    const stored = await this.getElementFromRedis(`sessions.${sessionId}.next`)
    return stored
  }

  async setNextElement (sessionId: string, element: React.Node) {
    const serialized = serializeElement(element)
    const key = `sessions.${sessionId}.next`
    await this.redis.set(key, serialized)
  }

  async getLinkElement (sessionId: string, link: string): Promise<React.Node> {
    const stored = await this.getElementFromRedis(`sessions.${sessionId}.links.${link}`)
    return stored || this.rootElement
  }

  async getElementFromRedis (key: string): Promise<React.Node> {
    const serialized = await this.redis.get(key)
    if (!serialized) return null
    return deserializeElement(serialized)
  }
}

async function promiseAllStable (awaitables: Array<Promise<any>>) {
    let currentAwaitablesLength = -1
    while (currentAwaitablesLength !== awaitables.length) {
      currentAwaitablesLength = awaitables.length
      await Promise.all(awaitables)
    }
}

function cleanResult (result) {
  if (Array.isArray(result)) {
    return result.map(cleanElement)
  } else {
    return cleanElement(result)
  }
}

function cleanElement (element) {
  if (!element) return element
  if (element.type === 'say') {
    return {...element, children: [element.children.join('')]}
  } else {
    return element
  }
}

export default ReactBot
