/**
 * The Session context provides a UID to identify the user being spoken to
 * Consuming components should use this ID to get the relevant data they
 * need for the session.
 * @flow
 */

import * as React from 'react'
import createAsContextConsumer from './createAsContextConsumer'
import Redis from 'ioredis'

// todo
// type Session = {
//   id: string,
//   get: (key: string) => Promise<any>,
//   set: (key: string, value: any) => Promise<void>
//   reset: () => Promise<void>
// }
export type Session = {
  id: string,
  redis: Redis
}

const defaultValue = {
  id: 'default-session',
  redis: new Redis()
}

export const {
  Provider: SessionProvider,
  Consumer: SessionConsumer
} = React.createContext(defaultValue)

export const asSessionConsumer = createAsContextConsumer(SessionConsumer, 'session')
