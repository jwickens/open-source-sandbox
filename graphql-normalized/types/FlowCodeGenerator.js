/**
 * Tool for writing code
 * NOTE: it would be great to use a standard tool to do this like something from babel toolchain but this does not exist for flow.
 * @flow
 */

type BlockType = 'exact' | 'normal'
class FlowCodeGenerator {
  output: string
  indentLevel: number
  indentWidth: number
  shouldComma: boolean
  currentBlockType: 'exact' | 'normal'
  constructor () {
    this.output = ''
    this.indentLevel = 0
    this.indentWidth = 2
    this.shouldComma = false
  }

  print (code: string) {
    this.output += code
  }

  printIndentation () {
    if (this.indentLevel > 0) {
      this.print(' '.repeat(this.indentLevel * this.indentWidth))
    }
  }

  printWithIndentation(code: string) {
    this.printIndentation()
    this.print(code)
  }

  printNewLine () {
    this.print('\n')
  }

  enterBlock (blockType: BlockType = 'exact') {
    this.currentBlockType = blockType
    this.indentLevel += 1
    this.print(this.currentOpenBlock())
    this.shouldComma = false
  }

  exitBlock () {
    this.printNewLine()
    this.indentLevel -= 1
    this.printWithIndentation(this.currentCloseBlock())
    this.shouldComma = true
    if (this.indentLevel === 0) {
      this.printNewLine()
    }
  }

  printInBlock (code: string) {
    this.commaIfNecessary()
    this.printNewLine()
    this.printWithIndentation(code)
    this.shouldComma = true
  }

  printProp (name: string) {
    this.printInBlock(`${name}: `)
  }

  commaIfNecessary () {
    if (this.shouldComma) {
      this.print(',')
    }
  }

  printPropType (type: string) {
    this.print(type)
    this.shouldComma = true
  }

  printTypeAlias (aliasName: string) {
    this.indentLevel = 0
    this.print(`type ${aliasName} = `)
    this.shouldComma = false
  }

  currentOpenBlock () {
    if (this.currentBlockType === 'exact') return '{|'
    else return '{'
  }

  currentCloseBlock () {
    if (this.currentBlockType === 'exact') return '|}'
    else return '}'
  }
}

module.exports = FlowCodeGenerator
