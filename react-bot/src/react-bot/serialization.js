/**
 * @flow
 */
import * as React from 'react'
import ReactBot from './ReactBot'
import hashIt from 'object-hash'

// TODO: other link types
// const MAGIC_ELEMENTS: ElementType[] = ['button', 'link']
const components: {[name: string]: React.ComponentType<any>} = {}

export function register (component: React.ComponentType<any>, ...otherNames: string[]) {
  let type: Function
  if (typeof component === 'function') type = component
  else if (component instanceof React.Component) type = component.type
  else throw Error(`${component.toString()} is not a stateless or class react Component`)
  components[type.name] = component
  otherNames.forEach(name => {
    component[name] = component
  })
}

export function getById (id: string) {
  return components[id]
}

export type SingleSerializedElement = {typeId: ?string, type: string, props: {[prop: string]: any}} 
export type SerializedElement = SingleSerializedElement | SingleSerializedElement[] | string

// maybe an idea for serializing the function
// function cleanProps (props) {
//   const newProps = {}
//   for (const key in props) {
//     const v = props[key]
//     if (typeof v === 'function') {
//       newProps[key] = { type: 'Function', value: v.toString() }
//     } else if {
//       newProps[key] = v
//     }
//   }
// }

function _serializeElement (element: React.Element<any> | string): SerializedElement {
  if (typeof element === 'string') return element
  let { props: { children, ...props }, type } = element
  let typeId
  if (typeof type === 'function') {
    typeId = type.name
    type = 'composite'
  } else if (type === React.Fragment) {
    type = 'fragment'
  }
  if (children) {
    props.children = React.Children
      .toArray(children)
      .map(_serializeElement)
  }
  return { type, typeId, props }
}

export function hashElement (element: React.Node): string {
  return hashIt(serializeElement(element))
}

export function serializeElement (element: React.Node): string {
  const cleaned = React.Children.toArray(element).map(_serializeElement)
  let serialized = cleaned
  if (cleaned.length === 1) {
    serialized = cleaned[0]
  } else if (cleaned.length === 0) {
    serialized = null
  }
  return JSON.stringify(serialized)
}

export function deserializeElement (element: string): React.Node {
  const flatElement = JSON.parse(element)
  return _deserializeElement(flatElement)
}

function _deserializeElement (flatElement: SerializedElement, key: ?number): React.Node {
  if (typeof flatElement === 'string') return flatElement
  if (Array.isArray(flatElement)) {
    return flatElement.map(_deserializeElement)
  }
  if (!flatElement.type) {
    console.error(flatElement)
    throw new Error(`Not valid SerializedJSX see logs for object`)
  }
  let { typeId, type, props } = flatElement
  if (type === 'composite') {
    // TODO these errors should be handled upstream
    if (!typeId) throw new Error(`expected composite element to have a typeId`)
    type = getById(typeId)
    if (!type) throw new Error(`${typeId} was not registered`)
  }
  if (type === 'fragment') {
    type = React.Fragment
  }
  if (props.children) {
    // cant use React.Children.map becaue the children are not actually valid react
    if (Array.isArray(props.children)) {
      props.children = props.children.map((e, i) => _deserializeElement(e, i))
    } else {
      // $FlowFixMe these are serialized elements not jsx elements
      props.children = _deserializeElement(props.children)
    }
  }
  props.key = key
  return React.createElement(type, props)
}
