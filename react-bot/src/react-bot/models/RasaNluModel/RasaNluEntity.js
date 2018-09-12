/**
 * @flow
 */

import * as React from 'react'

type EntityProps = { children: string }
type EntityState = {}

export default class Entity extends React.Component<EntityProps, EntityState> {
  static entityName: string
}
