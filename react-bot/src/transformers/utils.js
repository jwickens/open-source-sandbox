/**
 * @flow
 */

import type { WatsonWorkspace, WatsonNode, WatsonEntity, WatsonIntent, GenericOutput } from './types'

type SerializedElement = {
  type: string,
  children?: Array<SerializedElement | string>,
  props?: {[name: string]: mixed}
}

type SerializedJSX = SerializedElement | string

function getNextNode (firstNode: WatsonNode, allNodes: WatsonNode[]) {
  return allNodes.find(node => node.previous_sibling === firstNode.dialog_node)
}

export function parents (workspace: WatsonWorkspace): WatsonNode[] {
  const unsorted = workspace.dialog_nodes
    .filter(node => !node.parent)
  return sortNodesBySibling(unsorted)
}

export function nodeToCode (node: WatsonNode, workspace: WatsonWorkspace): string {
  switch (node.type) {
    case 'folder':
      return folderNodeToCode (node, workspace)
    case 'standard':
      return standardNodeToCode (node, workspace)
    default:
      throw new Error(`did not expect ${node.type} here`)
  }
}

function folderNodeToCode (node: WatsonNode, workspace: WatsonWorkspace) {
  const children = getAllChildrenForNode(node, workspace)
  const name = properCase(node.title || node.dialog_node)
  return `
    const ${name} = ({ children }: Props) => (
      <React.Fragment>
        ${children.map(c => `<${properCase(c.title || c.dialog_node)} />`).join('\n')}
      </React.Fragment>
    )
    register(${name})
  `
}

function standardNodeToCode (node: WatsonNode, workspace: WatsonWorkspace) {
  const tag = standardNodeAsTag(node, workspace)
  const name = properCase(node.title || node.dialog_node) 
  if (!tag) {
    console.warn(`${node.title || node.dialog_node} produced no node`)
    return ''
  }
  // $FlowFixMe
  const componentCode = functionalComponent(name, tag, ['bypassCondition'])
  return `
    ${componentCode}
    register(${name})
  `
}

export function siblingGroupContainer (name: string, siblingGroup: WatsonNode[]) {
  return `
    const ${name} = ({ children, evaluateFrom }: Props) => (
      <Watson.Model evaluateFrom={evaluateFrom}>
        ${linkToNodes(siblingGroup)}
      </Watson.Model>
    )
    register(${name})
  `
}

function linkToNodes (nodes: WatsonNode[]) {
  const entryTags = nodes
    .map(node =>
      // $FlowFixMe checked this in the titledParents
      `<${properCase(node.title || node.dialog_node)} />`
    )

  const withChildren = [ '{children}', ...entryTags ]
  return withChildren.join('\n')
}

function getAllSiblingRoots (workspace: WatsonWorkspace): WatsonNode[] {
  return workspace.dialog_nodes
    .filter(node => !node.previous_sibling && node.type !== 'response_condition')
    .sort((a, b) => {
      if (!a.parent) return -1
      else if (!b.parent) return 1
      else return 0
    })
}

function getAllSiblingsFromNode (node: WatsonNode, workspace: WatsonWorkspace, accum?: WatsonNode[]): WatsonNode[] {
  if (!accum) accum = [node]
  const nextNode = workspace.dialog_nodes.find(n =>
    n.previous_sibling === node.dialog_node &&
    n.type !== 'response_condition'
  )

  if (nextNode) {
    accum.push(nextNode)
    return getAllSiblingsFromNode(nextNode, workspace, accum)
  } else {
    return accum
  }
}

export function getAllSiblingGroups (workspace: WatsonWorkspace): WatsonNode[][] {
  const roots: WatsonNode[] = getAllSiblingRoots(workspace)
  return roots.map(n => getAllSiblingsFromNode(n, workspace))
}

function sortNodesBySibling (nodes: WatsonNode[]) {
  let nextNode = nodes.find(node => !node.previous_sibling)
  const sorted = []
  while (nextNode) {
    sorted.push(nextNode)
    nextNode = getNextNode(nextNode, nodes)
  }
  return sorted
}

export function intentToDeclaration (intent: WatsonIntent): string {
  const name = intent.intent
  return `const ${properCase(name)}Intent = Model.getIntent('${name}')`
}

export function entityToDeclaration (entity: WatsonEntity) {
  return `\nconst ${properCase(entity.entity)}Entity = Watson.Entity('${entity.entity}')`
}

export function nodeAsTag (node: WatsonNode, workspace: WatsonWorkspace, props: ?Object): SerializedJSX {
  // $FlowFixMe
  return { type: properCase(node.title || node.dialog_node), props }
}

function nodeByIdAsTag (nodeId: string, workspace: WatsonWorkspace, props: ?Object): SerializedJSX {
  const node = workspace.dialog_nodes.find(n => n.dialog_node === nodeId)
  if (!node) return ''
  return nodeAsTag(node, workspace, props)
}

export function standardNodeAsTag (node: WatsonNode, workspace: WatsonWorkspace) {
  const conditionNodeTag = nodeConditionAsTag(node)
  let children = nodeBodyAsTag(node, workspace)
  if (!conditionNodeTag) {
    return {
      type: 'React.Fragment',
      children
    }
  }
  return {
    ...conditionNodeTag,
    children
  }
}

function nodeBodyAsTag (node: WatsonNode, workspace: WatsonWorkspace) {
  let childrenTags: SerializedJSX[] = nodeOutputAsTags(node)
  const responseConditions = responseConditionsForNodeAsTags(node, workspace)
  if (responseConditions) {
    childrenTags = childrenTags.concat(responseConditions)
  }
  const jumpTo = jumpToForNodeAsTags(node, workspace)
  if (jumpTo) {
    childrenTags.push(jumpTo)
  }

  // need the context to be set before the output which may use set context
  const contextNodeTag = contextForNode(node, workspace)
  if (contextNodeTag) {
    childrenTags = [{...contextNodeTag, children: childrenTags }]
  }

  const nextNodeTag = nextForNode(node, workspace)
  if (nextNodeTag) {
    childrenTags.push(nextNodeTag)
  }

  if (childrenTags.length === 0) {
    console.warn(`node: ${node.title || node.dialog_node} has no children`)
  }

  return childrenTags
}

function jumpToForNodeAsTags (node: WatsonNode, workspace: WatsonWorkspace) {
  if (!node.next_step) return
  if (node.next_step.behavior === 'skip_user_input') {
    // immediately go to children
    return {
      type: getNodeChildrenContainerName(node),
      props: { evaluateFrom: '0' }
    }
  } else if (node.next_step.behavior === 'jump_to') {
    // if we're going to the children we might evaluate lower nodes
    if (node.next_step.selector === 'condition') {
      // $FlowFixMe
      const jumpedToNode = workspace.dialog_nodes.find(n => n.dialog_node === node.next_step.dialog_node)
      // $FlowFixMe
      if (!jumpedToNode) throw new Error(`expected to find node ${node.next_step.dialog_node}`)
      return {
        type: getNodeChildrenContainerNameForMemberNode(jumpedToNode, workspace),
        props: { evaluateFrom: getIndexAmongstSiblingsForNode(jumpedToNode, workspace) + '' }
      }
    } else {
      // otherwise immediatly evaluate the jumped to node  
      return nodeByIdAsTag(node.next_step.dialog_node, workspace, {bypassCondition: 'true'})
    }
  } else {
    throw new Error(`Did not recognize next_step behavior: ${node.next_step.behavior} for node ${node.dialog_node}`)
  }
}

function getIndexAmongstSiblingsForNode (node: WatsonNode, workspace: WatsonWorkspace) {
  const siblingGroups = getAllSiblingGroups(workspace)
  for (const group of siblingGroups) {
    for (let i = 0; i < group.length; i++) {
      const n = group[i]
      if (n.dialog_node === node.dialog_node) {
        return i
      }
    }
  }
  throw new Error(`expected to find the node in the sibling groups: ${node.dialog_node}`)
}

function contextForNode (node: WatsonNode, workspace: WatsonWorkspace) {
  if (node.context) {
    return { type: 'Watson.Session', props: { set: JSON.stringify(node.context) } }
  }
}

function responseConditionsForNodeAsTags (node: WatsonNode, workspace: WatsonWorkspace) {
  const responseConditions = workspace.dialog_nodes.filter(n => {
    return n.parent === node.dialog_node && n.type === 'response_condition'
  }).map(n => {
    const conditionTag = nodeConditionAsTag(n)
    return { ...conditionTag, children: nodeOutputAsTags(n) }
  })
  return responseConditions
}

function nextForNode (node: WatsonNode, workspace: WatsonWorkspace): ?SerializedJSX {
  if (node.type === 'folder' || node.next_step) return
  const childrenNodes = getAllChildrenForNode(node, workspace)
    .filter(c => {
      if (c.type === 'standard') {
        return true
      } else if (c.type === 'response_condition') {
        return false
      } else {
        console.warn(`dont know what to do with ${node.type} for next condition`)
        return false
      }
    })
  if (childrenNodes.length > 0) {
    return {
      type: 'Next',
      children: [{
        type: 'Watson.Model',
        children: [ 
          ...childrenNodes
            // $FlowFixMe fairly certain that n is not undefined
            .map(n => nodeAsTag(n, workspace))
            .filter(n => !!n),
          {
            type: 'Next',
            children: [{
              type: properCase(workspace.name),
            }]
          }
        ]
      }]
    }
  }
}

export function functionalComponent (title: string, children: SerializedJSX, props?: string[]) {
  let args = ''
  if (props) {
    args = `{${props.join(', ')}}: Props`
  }
  return `const ${title} = (${args}) => (\n${tagToString(children)}\n)`
}

export function getAllChildrenForNode (node: WatsonNode, workspace: WatsonWorkspace): WatsonNode[] {
  const unsorted = workspace.dialog_nodes.filter(n => n.parent === node.dialog_node)
  return sortNodesBySibling(unsorted)
}

export function nodeConditionAsTag (node: WatsonNode): ?SerializedElement {
  const { conditions } = node
  if (!conditions) return

  const transformedConditions = conditions
    .replace(/(?<![@$#])input/g, 'watson.input')
    .replace(/(?<![@$#])welcome/g, 'watson.welcome')
    .replace(/(?<![@$#])anything_else/g, 'watson.anything_else')

    .replace(/#([^\s]+)/g, `watson.intents['$1']`)
    // replace an entity value specifier with an equal sign
    .replace(/@([^\s]+):(\w+)/g, `watson.entities['$1'] == '$2'`)
    .replace(/@([^\s]+):\((.+)\)/g, `watson.entities['$1'] == '$2'`)
    // replace entities with a look up of the object
    .replace(/@([^\s:]+)/g, `watson.entities['$1']`)

    // replace session look-ups
    .replace(/\$(\w+)/g, `watson.session.$1`)

    .replace(/ = /g, ' == ')
    .replace(/ != /g, ' !== ')

  return { type: 'Watson.Condition', props: {match: `watson => ${transformedConditions}`, bypass: 'bypassCondition'} }
}

export function nodeOutputAsTags (node: WatsonNode): SerializedJSX[] {
  const { output } = node
  if (!output) return []
  const { text, generic } = output
  if (!text && !generic) return []
  if (generic) {
    // $FlowFixMe
    return nodeGenericOutputAsTags(generic, node)
  }
  if (typeof text === 'string') {
    return [{ type: 'say', children: [cleanOutputText(text)] }]
  }
  // $FlowFixMe
  return outputTextAsTags(text.values, text.selection_policy, node)

}

function nodeGenericOutputAsTags (generic: GenericOutput[], node: WatsonNode) {
  const o = generic.map(output => {
    if (output.response_type === 'text') {
      return outputTextAsTags(
        output.values.map(v => v.text),
        output.selection_policy,
        node
      ) 
    } else {
      console.warn(`WatsonTransformer does not handle: ${output.response_type} yet`)
    }
  })
  // remove any null values
  .filter(a => !!a)
  // reduce array of arrays to a simple array
  .reduce((accum, x) => accum.concat(x), [])
  return o
}

function cleanOutputText (text: string) {
  const hasCurlyBrackets = text.match(/[{}]/)
  const hasXml = text.match(/<\/?\w+ ?\/?>/)
  const needsEscaping = hasCurlyBrackets || hasXml
  const escapeJSXLeft = needsEscaping ? "'}" : ''
  const escapeJSXRight = needsEscaping ? "{'" : ''
  let input = text
  if (needsEscaping) {
    input = `{'${text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'}`
  }
  const cleaned = input
    .replace(/<\? now\(\) \?>/g, `{ (new Date()).toLocaleTimeString() }`)
    .replace(/<\? \$([^\s]+) \?>/g, `${escapeJSXLeft}<Watson.Value for={'$1'} />${escapeJSXRight}`)
    .replace(/\$(\w+)/g, match => `${escapeJSXLeft}<Watson.Value for={'${match}'} />${escapeJSXRight}`)

  return cleaned
}

function outputTextAsTags (texts: string[], selectionPolicy: 'sequential', node: WatsonNode): SerializedJSX[] {
  if (texts.length > 1 && selectionPolicy === 'sequential') {
    return [{ type: 'Sequential', children: outputTextValueAsTags(texts) }]
  } else if (texts.length > 1) {
    console.warn(`no component for ${selectionPolicy} at node: ${node.dialog_node}`)
    return [{ type: 'Sequential', children: outputTextValueAsTags(texts) }]
  } else {
    return outputTextValueAsTags(texts)
  }
}

function outputTextValueAsTags (texts: string[]): SerializedJSX[] {
  return texts.map(text => ({ type: 'say', children: [ cleanOutputText(text) ] }))
}

export function tagToString (tag: SerializedJSX): string {
  if (typeof tag === 'string') return tag
  if (tag.children && tag.children.length === 1 && typeof tag.children[0] === 'string') {
    // $FlowFixMe pretty sure we checked this is a string
    return `<${tag.type}${propsToString(tag.props)}>${tag.children[0]}</${tag.type}>`
  }
  if (tag.children) {
    return `<${tag.type}${propsToString(tag.props)}>\n` +
      tag.children
        // $FlowFixMe
        .map(tag => tagToString(tag))
        .join('\n') +
      '\n' + `</${tag.type}>`
  } else {
    return `<${tag.type}${propsToString(tag.props)} />`
  }
}

export function propsToString (props: ?{[name: string]: mixed}): string {
  if (!props) return ''
  const propsString = Object
    .keys(props)
    // $FlowFixMe already checked props is defined
    .filter(propName => !!props[propName])
    // $FlowFixMe already checked props is defined
    .map(propName => `${propName}={${props[propName].toString()}}`)
    .join(' ')
  return ' ' + propsString
}

export function properCase (name: string): string {
  return name
    .split(/[\s\-_]/)
    .filter(w => !w.match(/^\s*$/))
    .map(w => w[0].toLocaleUpperCase() + w.slice(1).toLocaleLowerCase())
    .join('')
    .replace(/\&/, 'And')
}

export function getNodeChildrenContainerName (parent: WatsonNode) {
  return properCase(parent.title || parent.dialog_node) + 'Children'
}

function getNodeChildrenContainerNameForMemberNode (member: WatsonNode, workspace: WatsonWorkspace) {
  const parent = workspace.dialog_nodes.find(n => n.dialog_node === member.parent)
  if (!parent) {
    return properCase(workspace.name)
  }
  return getNodeChildrenContainerName(parent)
}