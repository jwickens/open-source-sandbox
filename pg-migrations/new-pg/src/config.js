/**
 * @flow
 * @ignore
 */

type NodeEnv = 'development' | 'test' | 'production'

const env = ((process.env: any): {
  NODE_ENV: NodeEnv,
  [string]: string
})

export const {
  NODE_ENV
} = env

export const DEV = NODE_ENV === 'development'
export const TEST = NODE_ENV === 'test'
export const PROD = NODE_ENV === 'production'
