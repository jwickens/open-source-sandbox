/**
 * @flow
 */

import type { State as Model } from './WatsonModel'
import type { Session } from '../../contexts/Session'

export async function getValueWithKey (key: string, props: {model: Model, session: Session}) {
    const k = key.slice(1)
    if (key.match('@')) {
      const { entities } = await props.model.output
      const value = entities[k]
      return value
    } else if (key.match(/\$/)) {
      const redisKey = `sessions.${props.session.id}.watson_context`
      const session = await props.session.redis.get(redisKey)
      if (!session) return
      const value = JSON.parse(session)[k]
      return value
    } else {
      // assume key is the value
      return key
    }
}