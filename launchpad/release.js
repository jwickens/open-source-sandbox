#!/usr/bin/env node

/**
 * Release CLI tool for launchpad
 * @flow
 */

/*::
import type { Args as CommonArgs, Package } from './lib/common'
*/

const program = require('commander')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const standardVersion = require('standard-version')
const writeFile = promisify(fs.writeFile)
const { stage, wrappedExec, wrappedExec2, checkpoint, NPM_TOKEN } = require('./lib/common')
const { dockerPublish } = require('./lib/docker')
const serviceDir = path.join(__dirname, '..', 'services')
const librariesDir = path.join(__dirname, '..', 'libraries')
const { helmPublish } = require('./lib/helm')
const figures = require('figures')
const { nodePack } = require('./lib/node')
const { main: updateVersions } = require('./check-versions')
const cp = require('child_process')
const exec = promisify(cp.exec)
const glob = require('glob-promise')

if (require.main === module) {
  commander()
}

function commander () {
  program
    .version('1.0.0')
    .description('Create a new release of your platform deployable with Helm to any Kubernetes cluster.')

  program
    .option('--dry-run', 'Do a dry-run to show which commands will be run')
    .option('--canary [tag]', 'Use a canary release.')
    .option('--no-pack', 'Dont pack js modules')
    .option('--no-helm', 'Dont release to helm')
    .option('--no-update', 'Dont update package versions')
    .option('--no-docker', 'Dont run docker builds')
    .option('--no-bump', 'Dont update with semantic versioning')
    .option('--no-commit', 'Dont commit changes to git')
    .parse(process.argv)
  main(program).catch(err => {
    console.error(err)
    process.exit(1)
  })
}

/*::
type Args = {
  ...CommonArgs,
  canary: boolean | string,
  pack: boolean,
  update: boolean,
  helm: boolean,
  bump: boolean,
  commit: boolean,
  docker: boolean
}
 */
const gitShaPromise = gitSha()
async function main (commandArgs/*: Args */) {
  const { update, pack, helm, docker, bump, commit } = commandArgs

  // const updatedRaw = await wrappedExec2(`lerna updated --json`, { ...commandArgs, dryRun: false })
  // let updated = []
  // if (!updatedRaw.output.match(/No packages need updating/)) {
  //   updated = JSON.parse(updatedRaw.output.split('result').pop())
  // }

  await stage({
    ifCondition: update,
    func: updateNpmModules,
    commandArgs,
    // extraArgs: [updated],
    commitMessage: 'updating module versions based on git SHA'
  })
  await stage({
    ifCondition: pack,
    func: bundleNpmModules,
    commandArgs,
    // extraArgs: [updated],
    commitMessage: 'bundling js modules'
  })
  await stage({
    ifCondition: bump,
    func: versionCore,
    commandArgs,
    commitMessage: 'updating version and updating CHANGELOG'
  })
  await stage({
    ifCondition: docker,
    func: publishServices,
    // extraArgs: [updated],
    commandArgs,
    commitMessage: 'publishing dockers for services'
  })
  await stage({
    ifCondition: helm,
    func: helmPublish,
    commandArgs,
    commitMessage: 'creating a new helm release'
  })
  await stage({
    ifCondition: commit,
    func: gitCommit,
    commandArgs,
    commitMessage: 'tagging and committing changes to git'
  })
}

async function updateNpmModules (commandArgs, updated) {
  await Promise.all([serviceDir, librariesDir].map(dir =>
    publishPackages(dir, async (name, pkgPath, pkg) => {
      const sha = await gitShaPromise
      pkg.version = `0.0.0-${sha}`
      await writeFile(path.join(pkgPath, 'package.json'), JSON.stringify(pkg, null, 2))
      // TODO: incremental builds
      // if (updated.find(p => p.name === pkg.name)) {
      //   const sha = await gitShaPromise
      //   pkg.version = `0.0.0-${sha}`
      //   await writeFile(path.join(pkgPath, 'package.json'), JSON.stringify(pkg, null, 2))
      // } else {
      //   console.log(`${name} has no updates, not bumping version`)
      // }
    })
  ))
  // use the gitsha as the version
  await updateVersions({update: true})
}

async function bundleNpmModules (commandArgs, updated) {
  console.log((await wrappedExec2(`mkdir -p common-node/dist-packages`, commandArgs)).colorOutput)
  // set the packages to use tarball locations for when in docker
  await updateVersions({tarballs: true})
  // prepare dist-packages folder for packed tarballs
  // console.log((await wrappedExec2(`rm -rf common-node/dist-packages`, commandArgs)).colorOutput)
  // create tarballs and move them into dist-packages
  await Promise.all([serviceDir, librariesDir].map(dir =>
    publishPackages(dir, async (name, path) =>
      nodePack(name, path, commandArgs)
    )
  ))
}

async function publishServices (commandArgs, updated/*: Package[] */) {
  // create the common node docker base image
  const token = NPM_TOKEN.split('=').pop()
  if (typeof token !== 'string') throw new Error('expected an npm token')
  const { colorOutput } = await wrappedExec2(`docker build --build-arg NPM_TOKEN=${token.trim()} -t common-node:latest .`, commandArgs, {cwd: path.join(__dirname, '..', 'common-node')})
  console.log(colorOutput)
  // create dockers for each service
  await publishPackages(serviceDir, async (name, path, pkg) => {
    await dockerPublish(name, path, commandArgs)
    // See note above
    // if (updated.find(p => p.name === pkg.name)) {
    // } else {
    //   console.log(`${name} has no updates, not publishing a docker`)
    // }
  })
}

async function versionCore (commandArgs) {
  // since we noped git when versioning before with lerna add it now
  const {dryRun, canary} = commandArgs
  return standardVersion({
    dryRun,
    silent: true,
    skip: {
      tag: true,
      commit: true,
      changelog: !!canary
    },
    prerelease: canary && (typeof canary === 'string' ? canary : 'alpha')
  })
}

async function gitCommit (commandArgs) {
  const { canary } = commandArgs
  const centralPkg = require('../package.json')
  const version = centralPkg.version
  const commitMsg = `chore(release): release ${version}`
  console.log(await wrappedExec(`git add package.json "./**/package.json" ${canary ? '' : 'CHANGELOG.md'} helm/platform`, commandArgs))
  console.log(await wrappedExec(`git commit -m '${commitMsg}'`, commandArgs))
  console.log(await wrappedExec(`git tag -a v${version} -m '${commitMsg}'`, commandArgs))
  const message = 'git push --follow-tags origin master'
  checkpoint(`Run \`${message}\` to publish`, chalk.blue(figures.info))
}

/*::
type PublishFunction = (packageName: string, packagePath: string, pkg: Package) => Promise<any>
*/

// publishes
async function publishPackages (dir /*: string */, cmd/*: PublishFunction */) {
  const packages = await glob(`${dir}/*/package.json`)
  await Promise.all(packages.map(async packagePath => {
    const pkg = require(packagePath)
    await cmd(pkg.name, path.join(packagePath, '..'), pkg)
  }))
}

async function gitSha () {
  const { stdout } = await exec('git rev-parse --short HEAD')
  return stdout.trim()
}
