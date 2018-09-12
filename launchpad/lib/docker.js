/**
 * @flow
 */

const {
  wrappedExec,
  genericPublish,
  warningAlreadyPublished,
  DOCKER_REGISTRY
} = require('./common')

/*::
import type { Args, Package } from './common'
*/

async function dockerPublish (packageName/*: string */, packagePath/*: string */, commandArgs/*: Args */) {
  await genericPublish(packageName, packagePath, async (pkg, pkgName, pkgPath) => {
    const tag = createDockerImageName(pkg)
    if (await dockerBuildExistsAlready(tag, commandArgs)) {
      return warningAlreadyPublished(pkg, tag)
    } else {
      let output = ''
      output += await dockerBuildLib(tag, packagePath, commandArgs)
      output += await dockerBuild(tag, packagePath, commandArgs)
      output += await dockerPush(tag, commandArgs)
      console.log(output)
    }
  })
}

function createDockerImageName (pkg/*: Package */) {
  const { name, version } = pkg
  // might want to validate is correct package
  return `${DOCKER_REGISTRY}/${match[1]}:${version}`
}

async function dockerBuildExistsAlready (tag/*: string */, commandArgs/*: Args */) {
  const result = await wrappedExec(`docker inspect --type=image ${tag}`, commandArgs)
  return !result.match('No such image:')
}

// todo check if build is necessary - if we published this is already built
async function dockerBuildLib (tag/*: string */, cwd/*: string */, commandArgs/*: Args */) {
  return wrappedExec(`yarn build`, commandArgs, {cwd})
}

async function dockerBuild (tag/*: string */, cwd/*: string */, commandArgs/*: Args */) {
  return wrappedExec(`docker build -t ${tag} .`, commandArgs, {cwd})
}

async function dockerPush (tag/*: string */, commandArgs/*: Args */) {
  return wrappedExec(`docker push ${tag}`, commandArgs)
}

module.exports = {
  dockerPublish,
  createDockerImageName
}
