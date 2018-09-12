#!/usr/bin/env node

/**
 * script to check versions are up to synced between listed version of package in mono-repo
 * and version used as dep elsewhere in mono-repo
 * @flow
 */

const program = require('commander')
const fs = require('fs')
const { getPackages } = require('./lib/node')

if (require.main === module) {
  commander()
}

function commander () {
  program
    .option('-u, --update', 'Update the versions')
    .option('-t, --tarballs', 'Rewrite to use tarball location')
    .version('0.0.1')

  program
    .parse(process.argv)
  main(program).catch(err => console.error(err))
}

/*::
type CommandArgs = {
  update?: boolean,
  tarballs?: boolean
}
*/

async function main (args /*: CommandArgs */) {
  const { update, tarballs } = args
  const packages = await getPackages()

  // collect info on latest version
  const monoRepoPackages = []
  const currentVersions = {}
  packages.forEach(({pkg}) => {
    monoRepoPackages.push(pkg.name)
    currentVersions[pkg.name] = pkg.version
  })

  // warn for each package
  packages.forEach(({ pkg, location }) => {
    if (pkg.dependencies) {
      checkDepsUptoDate(currentVersions, pkg.dependencies, pkg.name, args)
    }
    if (pkg.devDependencies) {
      checkDepsUptoDate(currentVersions, pkg.devDependencies, pkg.name, args)
    }
    if (update || tarballs) {
      fs.writeFileSync(location, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    }
  })
  console.log(`checked ${packages.length} packages`)
}

function createTarballLocation (depName, depVersion) {
  return `file:///app/dist-packages/${packageNameToTarballName(depName)}-v${depVersion}.tgz`
}

function packageNameToTarballName (name) {
  name = name.replace('@', '')
  name = name.replace('/', '-')
  return name
}

/*::
type Deps = {
  [packageName: string]: string
}
*/
function checkDepsUptoDate (upToDateDeps/*: Deps */, currentDeps/*: Deps */, packageName/*: string */, args/*: CommandArgs */) {
  const { update, tarballs } = args
  Object.keys(currentDeps).forEach(depName => {
    const upToDateVersion = upToDateDeps[depName]
    if (upToDateVersion) {
      // get listed version, removing any carets. semver package doesnt have a nice way to do this
      const currentVersion = currentDeps[depName].replace('^', '')
      if (currentVersion !== upToDateVersion) {
        if (!update && !tarballs) {
          console.warn(`package ${packageName} has version not up to date: ${depName}`)
        }
        if (update) {
          currentDeps[depName] = upToDateVersion
        }
      }
      if (tarballs) {
        currentDeps[depName] = createTarballLocation(depName, upToDateVersion)
      }
    }
  })
  return currentDeps
}

module.exports = {
  main
}
