/**
 * The Async provider allows the host to wait for all async calls
 * to complete before shutting down.
 * @flow
 */

import * as React from 'react'
import createAsContextConsumer from './createAsContextConsumer'


// todo
// type Async = {
//   queue: (p: Promise<any>) => any,
//   flush: () => Promise<any>
// }
export type Async = (p: Promise<any>) => any

const defaultValue = (p: Promise<any>) => (null: any)

export const {
  /* Do not use the AsyncProvider yourself, this is provided by mounting the bot */
  Provider: AsyncProvider,
  Consumer: AsyncConsumer
} = React.createContext(defaultValue)

export const asAsyncConsumer = createAsContextConsumer(AsyncConsumer, 'async')
