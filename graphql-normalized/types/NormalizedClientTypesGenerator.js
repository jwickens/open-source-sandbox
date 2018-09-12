/**
 * Generates flow types from graphql schema + operations for use by clientsj
 * @flow
 */

import type {
  GraphQLSchema,
  FieldNode,
  OperationDefinitionNode,
  SelectionSetNode,
  FragmentSpreadNode,
  GraphQLOutputType,
  FragmentDefinitionNode,
  DocumentNode
} from 'graphql'

const {
  separateOperations,
  ValidationContext,
  TypeInfo,
  visit,
  visitWithTypeInfo,
  typeFromAST,
  isScalarType,
  isListType,
  isEnumType,
  isNonNullType,
  isObjectType
} = require('graphql')

const dedent = require('dedent')
const { Kind } = require('graphql')
const CodeGenerator = require('./FlowCodeGenerator')

type Operation = {
  operationName: string,
  variableType: string,
  returnType: string
}

class GraphQlToFlow {
  document: DocumentNode
  normalizedDocument: DocumentNode
  schema: GraphQLSchema
  operations: Operation[]
  normalSelectionTypes: Array<SelectionSetNode>
  operationNodes: OperationDefinitionNode[]
  fragmentDefinitions: {
    [name: strings]: Array<FragmentDefinitionNode>
  }
  typeInfo: TypeInfo
  constructor () {
    // TODO
    this.document = require('GET THE OPERATIONS').operations
    this.schema = require('GET THE SCHEMA').schema
    this.typeInfo = new TypeInfo(this.schema)
    this.parseFragmentDefinitions()
    // this.normalizeSelections()
    // this.generateEnums()
    this.generate()
  }

  parseFragmentDefinitions () {
    this.fragmentDefinitions = {}
    visit(this.document, {
      FragmentDefinition: (node: FragmentDefinitionNode) => {
        this.fragmentDefinitions[node.name.value] = node
      }
    })
  }

  normalizeSelections () {
    this.normalizedDocument = visit(this.document, {
      SelectionSet: (node: SelectionSetNode, key: string | number | void) => {
        if (this.isSelectionNormal(node)) {
          return [{
            kind: 'SelectionSet',
            selections: [{
              kind: 'Field',
              foreign: true,
              name: {
                value: key + 'Id'
              }
            }]
          }]
        }
      }
    })
  }

  generateFlowTypes () {
    // const schema = buildSchema(schemaString)
  }

  normalizeSelectionSet(node: SelectionSetNode) {
    node.selections
  }

  isSelectionNormal (node: SelectionSetNode) {
    let hasId = false
    let hasTypeName = false
    node.selections.forEach(selectionNode => {
      switch (selectionNode.kind) {
        case 'Field':
          if (selectionNode.name.value === 'id') {
            hasId = true
          } else if (selectionNode.name.value === '__typename') {
            hasTypeName = true
          }
          return
        case 'FragmentSpread':
          const def = this.fragmentDefinitions[selectionNode.name.value]
          if (this.isSelectionNormal(def.selectionSet)) {
            hasId = true
            hasTypeName = true
          }
          return
        case 'InlineFragment':
          console.warn('inline fragments not supported yet')
          return
      }
    })
    return hasId && hasTypeName
  }

  normalize () {
    visit(this.document, {
      SelectionSet: (node: SelectionSetNode) => {
        return this.normalizeSelectionSet(node)
      }
    })
  }

  // todo
  generateEnums () {
  }

  generate () {
    this.operationNodes = []
    const generator = new CodeGenerator()
    visit(this.document, visitWithTypeInfo(this.typeInfo, {
      OperationDefinition: {
        enter: (node) => {
          generator.printTypeAlias(`${node.name.value}Result`)
          generator.enterBlock()
        },
        leave: (node) => {
          generator.exitBlock()
        }
      },
      FragmentDefinition: {
        enter: (node) => {
          generator.printTypeAlias(`${node.name.value}Fragment`)
          generator.enterBlock()
        },
        leave: (node) => {
          generator.exitBlock()
        }
      },
      FragmentSpread: (node: FragmentSpreadNode) => {
        generator.printNewLine()
        generator.printWithIndentation(`...${node.name.value}Fragment`)
        generator.shouldComma = true
      },
      Field: {
        enter: (node: FieldNode) => {
          if (node.selectionSet && this.isSelectionNormal(node.selectionSet)) {
            generator.printInBlock(`${node.name.value}Id: string`)
            // dont process this node anymore
            return false
          } else {
            generator.printProp(node.name.value)
            let t = this.typeInfo.getType()
            if (t) {
              this.generateReturnType(t, generator)
            }
          }
        },
        leave: (node: FieldNode) => {
          let t = this.typeInfo.getType()
          if (isNonNullType(t)) {
            t = t.ofType
          }
          if (!isScalarType(t) && !isEnumType(t) && !isListType(t)) {
            generator.exitBlock()
          }
        }
      }
    }))
    console.log(generator.output)
  }

  writeNodeTypeIfNecessary (node) {
  }

  generateReturnType (t: GraphQLOutputType, generator: CodeGenerator) {
    if (typeof t === 'string') code += `wierd string: ${t}`
    if (!isNonNullType(t)) {
      generator.print('?')
    } else {
      t = t.ofType
    }
    if (isObjectType(t)) {
      generator.enterBlock()
    } else if (isListType(t)) {
      if (isNonNullType(t.ofType)) {
        generator.printPropType(`Array<${t.ofType.ofType}>`)
      } else {
        generator.printPropType(`Array<${t.ofType} | void>`)
      }
    } else if (isScalarType(t) || t.name === 'ID') {
      switch (t.name) {
        case 'Int':
        case 'Float':
          generator.printPropType('number')
          break
        case 'String': 
        case 'DateTime': 
        case 'ID': 
          generator.printPropType('string')
          break
        case 'Boolean':
          generator.printPropType('boolean')
          break
        default:
          generator.printPropType(t.name)
      }
    } else if (isEnumType(t)) {
      generator.printPropType(t.getValues().map(v => `'${v.value}'`).join(' | '))
    } else {
      generator.printPropType(JSON.stringify(Object.values(t)) + ' (unkown parent type),\n')
    }
  }

  // Create a type that represents the GraphQlAPI assuming static operations
  graphqlApiType (ops: Operation[]) {
    const operationsAsFlow = ops
      .map(({operationName: O, variableType: V, returnType: R}) =>
        `GenericGraphQlApi<${O}, ${V}, ${R}>`)
      .join(' |\n')
    return dedent`
      type GraphQlApiParams<O, V> = {
        operationName: O,
        variables: V
      }
      type GenericGraphQlApi<O, V, R> = (params: GraphQlApiParams<O, V>) => R
      type GraphQlApi = ${operationsAsFlow}`
  }

  getFieldSet (schema: GraphQLSchema, selections: FieldNode[], document) {
    return selections.reduce((fields, ast) => {
      switch (ast.kind) {
        case Kind.FIELD:
          if (ast.selectionSet) {
            const newFields = this.getFieldSet(schema, ast.selectionSet.selections)
            return [...fields, ...newFields]
          }
          return [...fields, typeFromAST(schema, ast)]
        case Kind.FRAGMENT_SPREAD:
          console.log(ast)
          return fields
        default:
          throw new Error(`unexpected ${ast.kind}`)
      }
    }, [])
  }
}

module.exports = NormalizedClientTypesGenerator
