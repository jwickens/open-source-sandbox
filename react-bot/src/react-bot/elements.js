/**
 * @flow
 */

import BaseElement from './BaseElement'
import Say from './Say'
import Wait from './Wait'
import Next from './Next'
import SpeechFrameHost from '../hosts/SpeechFrameHost'

export const CONTENT_TYPES = [
  'say',
  'cards',
  'card',
  'button',
  'webview',
  'typing',
  'img',
  'file'
]

export type ContentType = 'say' |
  'cards' |
  'webview' |
  'button' |
  'typing' |
  'img' |
  'file'


/* hyper link types */
export const LINK_TYPES = ['next', 'link', 'schedule']
export type LinkType = 'next' |
  'link' |
  'schedule'
export type ElementType = LinkType | ContentType | ControlType | SubContentType


/// const SUB_CONTENT_TYPES = ['card']
export type SubContentType = 'card'

// const CONTROL_TYPES = ['wait']
export type ControlType = 'wait'
  
// really createInstance
export const createElement = (type: ElementType, props: any, root: SpeechFrameHost) => {
  switch (type) {
    case 'say':
      return new Say(props, root)
    case 'next':
      return new Next(props, root)
    case 'wait':
      return new Wait(props, root)
    default:
      throw new Error(`unrecognized type: ${type}`)
  }
}