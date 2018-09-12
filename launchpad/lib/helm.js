#!/usr/bin/env node

/**
 * Create a helm release using the image names created by the docker-build script
 * The chart templates can be found in the helm folder
 * @flow
 */

const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const cp = require('child_process')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const exec = promisify(cp.exec)
const chalk = require('chalk')
const { createDockerImageName } = require('./docker')

const CHART = process.env.CHART_FILE
const VALUES = process.env.VALUES_FILE

/*::
import type { Args } from './common'
*/
async function helmPublish (commandArgs/*: Args */) {
  const version = await updateChart()
  const summary = await updateValues()
  // Todo
  console.log(`THIS PROJECTS NAME release ${chalk.bold(version)}`)
  console.log(chalk.grey('Service Versions:'))
  console.log(chalk.grey(JSON.stringify(summary, null, 2)))
}

async function updateChart () {
  const centralPkg = require('../../package.json')
  const version = centralPkg.version
  const chartFile = await readFile(CHART)
  const chartSpec = yaml.safeLoad(chartFile)
  const updatedChart = {
    ...chartSpec,
    version: version
  }

  const updatedChartFile = yaml.safeDump(updatedChart)
  fs.writeFileSync(CHART, updatedChartFile)
  return version
}

async function updateValues () {
  const { stdout: releasedVersionsRaw } = await exec('lerna ls --json')
  const releasedVersions = JSON.parse(releasedVersionsRaw)
  const valuesFile = await readFile(VALUES)
  const valuesSpec = yaml.safeLoad(valuesFile)

  const updatedValues = {
    ...valuesSpec
  }
  const summary = {}
  releasedVersions.forEach(pkg => {
    const serviceName = isService(pkg.name)
    if (!serviceName) return
    // the charts user camel case names
    const name = `${serviceName}Service`
    // specify the correct version
    const tag = createDockerImageName(pkg)
    // only update if in the values spec
    if (updatedValues[name]) {
      updatedValues[name] = tag
      summary[name] = tag
    } else {
      console.warn(`service ${name} not specified in values.yaml`)
    }
  })

  const updatedValuesFile = yaml.safeDump(updatedValues)
  await writeFile(VALUES, updatedValuesFile)
  return summary
}

function isService (name) {
  // defunct post open-sourcing, find another way
  const reg = /.?/
  const match = reg.exec(name)
  if (!match) {
    return
  }
  return match[1]
}

module.exports = { helmPublish }
