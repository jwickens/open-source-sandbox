/**
 * @flow
 */

import * as React from 'react'
import {
  deserializeElement,
  serializeElement
} from '../serialization'
import { register } from '../'
import { exportAllDeclaration } from '@babel/types';
import TestRenderer from 'react-test-renderer'
import containDeep from 'jest-expect-contain-deep'

const testTransform = (descr, element) => {
  test(descr, () => {
    const transformed = serializeElement(element)
    const backAgain = deserializeElement(transformed)
    // $FlowFixMe all the tests bring back single element - dont know how to assert
    expect(Object.keys(backAgain.props)).toEqual(Object.keys(element.props))
    const original = TestRenderer.create(element)
    const result = TestRenderer.create(backAgain)
    expect(result.toJSON()).toEqual(containDeep(original.toJSON()))
  })
}

const Component = ({a}: {a?: string}) => (
  <say>hi { a || 'there' }</say>
)
register(Component)
const Container = ({children}) => (
  <next>
    {children}
  </next>
)
register(Container)

describe('element serialization', () => {
  testTransform('one node', <Component />)
  testTransform('fragment with two nodes',   <React.Fragment><say>hi</say><say>bye</say></React.Fragment>)
  testTransform('nested elements', <Container><Container><Component /></Container></Container>)
  testTransform('attributes', <Component a={'sup'}></Component>)
  // functions don't work!
  // testTransform('attributes with func', <Container a={x => x + 2}></Container>)
})
