/**
 * @flow
 */

import * as React from 'react'
import * as Bot from '../'

const NextBot = () => (
  <say>bye</say>
)
Bot.register(NextBot)

const MyBot = () => (
  <React.Fragment>
    <say>hi</say>
    <Bot.Next><NextBot /></Bot.Next>
  </React.Fragment>
)
Bot.register(MyBot)

const botId = '1'
const sessionId = '1'
describe('ReactBot', () => {
  test('Doesnt blow up', async () => {
    const r = Bot.connect(<MyBot />, botId)
    await r.clearSession(sessionId)
    const result = await r.message(sessionId, '')
    expect(result.children).toEqual(['hi'])

    const result2 = await r.message(sessionId, '')
    expect(result2.children).toEqual(['bye'])
  })

  test('Will throw an error if the passed bot is not a an element', async () => {
    // $FlowFixMe we expect this to error
    expect(() => Bot.connect(MyBot, botId)).toThrow('First argument')
  })
})
