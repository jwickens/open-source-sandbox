/**
 * utils for scripts
 * @flow
 */

const chalk = require('chalk')
const figures = require('figures')
const cp = require('child_process')
const fs = require('fs')
const path = require('path')

// A few common constants

const DOCKER_REGISTRY = process.env.DOCKER_REGISTRY
const NPM_TOKEN = fs.readFileSync(path.join(__dirname, '..', '..', '.npmrc'), 'utf8')

/*::
export type Args = {
  dryRun?: ?boolean,
  canary?: boolean | ?string
}

export type StageParams<A, B> = {
  ifCondition?: boolean,
  commandArgs: A,
  func: (cmdArgs: A, ...B) => Promise<any>,
  commitMessage: string,
  extraArgs?: B
}

export type Package = {
  name: string,
  version: string
}
*/

async function stage (stageParams/*: StageParams<any, any> */) {
  const { ifCondition, func, commitMessage, commandArgs, extraArgs = [] } = stageParams
  if (ifCondition) {
    checkpoint(commitMessage)
    await func(commandArgs, ...extraArgs)
  } else {
    checkpoint(`not ${commitMessage}`, chalk.red(figures.cross))
  }
}

const defaultFigure = chalk.green(figures.tick)
async function checkpoint (message/*: string */, figure/*: ?string */) {
  console.log(`${figure || defaultFigure} ${message}`)
}

function errorInPackage (pkg/*: Package */, error/*: Error */) {
  console.error(chalk.red(`(${pkg.name}) ERROR: ${error.message}`))
}

function warningAlreadyPublished (pkg/*: Package */, overrideTag/*: ?string */) {
  console.log(chalk.grey(`(${pkg.name}): already published ${overrideTag || pkg.version}`))
}

/*::
type PackagerFunc = (pkg: {version: string, name: string}, packageName: string, packagePath: string) => Promise<any>
*/
async function genericPublish (packageName/*: string */, packagePath/*: string */, packagerFunc/*: PackagerFunc */) {
  // $FlowFixMe "arg passed to require must be literal string"
  const pkg = require(path.join(packagePath, 'package.json'))
  await packagerFunc(pkg, packageName, packagePath)
}

async function wrappedExec (command/*: string */, commandArgs/*: Args */, opts/*: * */) {
  let output = chalk.grey(command) + '\n'
  const { dryRun } = commandArgs
  if (dryRun) return output
  const child = cp.exec(command, opts)
  child.stdout.on('data', data => { output += chalk.grey(data) })
  child.stderr.on('data', data => { output += chalk.yellow(data) })
  await new Promise((resolve, reject) => {
    child.on('close', resolve)
    child.on('error', reject)
  })
  return output
}

async function wrappedExec2 (command/*: string */, commandArgs/*: Args */, opts/*: * */) {
  let colorOutput = chalk.grey(command) + '\n'
  let output = ''
  const { dryRun } = commandArgs
  if (dryRun) return { output, colorOutput }
  const child = cp.exec(command, opts)
  child.stdout.on('data', data => {
    output += data
    colorOutput += chalk.grey(data)
  })
  child.stderr.on('data', data => {
    output += data
    colorOutput += chalk.yellow(data)
  })
  await new Promise((resolve, reject) => {
    child.on('close', resolve)
    child.on('error', reject)
  })
  return {
    output,
    colorOutput
  }
}

module.exports = {
  stage,
  checkpoint,
  errorInPackage,
  warningAlreadyPublished,
  wrappedExec,
  wrappedExec2,
  genericPublish,
  NPM_TOKEN,
  DOCKER_REGISTRY
}
