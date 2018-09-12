/**
 * @flow
 */

export type DataByGraphqlType = {
  [__typename: string]: {
    [id: string]: any
  }
}

export type NormalizedData = {
  graphqlData: DataByGraphqlType,
  result: any
}

export type Node = {
  id: string,
  __typename: string
}

type Edge = {
  node: Node,
  cursor: string
}

export default class Normalizer {
  nodes: Node[]
  constructor () {
    this.nodes = []
  }

  normalize (input: any): NormalizedData {
    const result = this.visit(input)
    const graphqlData = this.nodesListToHash()
    return { result, graphqlData }
  }

  nodesListToHash (): DataByGraphqlType {
    const graphqlData = {}
    this.nodes.forEach(node => {
      const { __typename, id } = node
      if (!graphqlData[__typename]) {
        graphqlData[__typename] = {}
      }
      graphqlData[__typename][id] = node
    })
    return graphqlData
  }

  visit (value: any) {
    if (typeof value !== 'object' || !value) {
      return value
    }
    if (isEdge(value)) {
      return this.normalizeEdge(value)
    } else if (isNode(value)) {
      return this.normalizeNode(value)
    } else if (Array.isArray(value)) {
      return this.normalizeArray(value)
    } else {
      return this.normalizeObject(value)
    }
  }

  normalizeArray (arr: any[]): any[] {
    return arr.map(v => this.visit(v))
  }

  normalizeObject (obj: {}) {
    const newObj = {}
    for (const prop in obj) {
      newObj[prop] = this.visit(obj[prop])
    }
    return newObj
  }

  normalizeEdge (edge: Edge) {
    const { node, cursor } = edge
    return {
      cursor,
      nodeType: node.__typename,
      // for backwards compatiblity
      node: this.normalizeNode(node),
      nodeId: this.normalizeNode(node)
    }
  }

  normalizeNode (node: Node) {
    const newNode = (({}: any): Node)
    for (const prop in node) {
      newNode[prop] = this.visit(node[prop])
    }
    this.nodes.push(newNode)
    return node.id
  }
}

function isNode (value: any) {
  return value.id && value.__typename
}

function isEdge (value: any) {
  return value.node && isNode(value.node) && value.cursor
}
