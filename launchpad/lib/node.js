/**
 * @flow
 */

const glob = require('glob')
const fs = require('fs')
const { promisify } = require('util')
const path = require('path')
const readDir = promisify(fs.readdir)
const {
  wrappedExec2,
  genericPublish
} = require('./common')

/*::
import type { Args } from './common'
*/

// by coicidence, both where the package.jsons are located and this script are two levels in
const tarballLocation = '../../common-node/dist-packages'
const tarballsPromise = readDir(path.join(__dirname, tarballLocation)).catch((err) => console.error(err) || [])
async function nodePack (packageName/*: string */, packagePath/*: string */, commandArgs/*: Args */) {
  let output = ''
  const exists = await checkIfTarballExists(packagePath)
  if (exists) return console.log(`package ${packageName} already published at current version`)
  await genericPublish(packageName, packagePath, async (pkg, pkgName, pkgPath) => {
    output += await build(packagePath, commandArgs)
    output += await pack(packagePath, commandArgs)
    console.log(output)
  })
}

async function build (cwd/*: string */, commandArgs/*: Args */) {
  const {colorOutput} = await wrappedExec2(`yarn build`, commandArgs, {cwd})
  return colorOutput
}

const TARNAME_RE = /Wrote tarball to ".*\/(.*)"/
async function pack (cwd/*: string */, commandArgs/*: Args */) {
  const {colorOutput, output} = await wrappedExec2(`yarn pack`, commandArgs, {cwd})
  const match = TARNAME_RE.exec(output)
  if (!match) throw new Error(`tarball not built: ${colorOutput}`)
  const tarname = match[1]
  return colorOutput + await moveToPackageDir(tarname, cwd, commandArgs)
}

async function checkIfTarballExists (packagePath) {
  // $FlowFixMe
  const pkg = require(path.join(packagePath, 'package.json'))
  const { name, version } = pkg
  // just handling our specific names so far
  const kebabName = name.replace('@', '-').replace('/', '-').replace(/^-/, '')
  const tarballs = await tarballsPromise
  return tarballs.find(filename => filename.match(`${kebabName}-v${version}`))
}

async function moveToPackageDir (tarname, cwd/*: string */, commandArgs/*: Args */) {
  const { colorOutput } = await wrappedExec2(`mv ${tarname} ${tarballLocation}`, commandArgs, {cwd})
  return colorOutput
}

async function getPackages () {
  const { workspaces } = require('../../package.json')
  const pkgPerWorkspaces = await Promise.all(workspaces.map(workspace => {
    return new Promise((resolve, reject) => {
      glob(`${workspace}/package.json`, (err, matches) => {
        if (err) reject(err)
        else resolve(matches)
      })
    })
  }))
  const packageLocs = pkgPerWorkspaces.reduce((a, b) => a.concat(b))
  const packages = packageLocs.map(pkgLoc => {
    const location = '../../' + pkgLoc
    // $FlowFixMe sorry flow im too lazy to tell you its a string
    const pkg = require(location)
    return { location: pkgLoc, pkg }
  })
  return packages
}

module.exports = { getPackages, nodePack }
