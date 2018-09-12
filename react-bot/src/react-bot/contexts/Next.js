/**
 * The Next context provides a way to for the bot to specify the next
 * element to be used on the next user's message
 * @flow
 */

import * as React from 'react'
import createAsContextConsumer from './createAsContextConsumer'

export type Next = {
  get: () => Promise<React.Node>,
  set: (next: React.Node) => Promise<void>
}

let nextElement: React.Node
const defaultValue: Next = {
  get: () => Promise.resolve(nextElement),
  set: (next) => Promise.resolve()
}

export const {
  Provider: NextProvider,
  Consumer: NextConsumer
} = React.createContext(defaultValue)

export const asNextConsumer = createAsContextConsumer(NextConsumer, 'next')
