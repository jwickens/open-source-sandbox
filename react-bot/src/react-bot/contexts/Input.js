/**
 * A context to get the most recent input from the user
 * @flow
 */

import * as React from 'react'
import createAsContextConsumer from './createAsContextConsumer'

export type Input = string

export const {
  /* Do not use the Input provider directly, this is done when mounting the bot */
  Provider: InputProvider,
  Consumer: InputConsumer
} = React.createContext('')

export const asInputConsumer = createAsContextConsumer(InputConsumer, 'input')
