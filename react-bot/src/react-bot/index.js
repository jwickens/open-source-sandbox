/**
 * Public API for React-Bot
 * @flow
 */

import * as React from 'react'
import { default as ReactBot } from './ReactBot'

/**
 * Create a new ReactBot
 * @param {*} botJsx 
 * @param {*} id 
 */
export function connect (botJsx: React.Element<any>, id: string) {
  return new ReactBot(botJsx, id)
}
export { default as ReactBot } from './ReactBot'

export * from './serialization'

// see docs/components.md
export * from './components'

// see docs/models.md
export * from './models'
