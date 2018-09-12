/**
 * @flow
 */

import testData from '../__assets__/test-data'

import Normalizer from '../Normalizer'

describe('normalize', () => {
  it('can normalize', () => {
    const normalizer = new Normalizer()
    const result = normalizer.normalize(testData)
    expect(result.graphqlData.Conversation).toBeDefined()
    expect(result).toMatchSnapshot()
  })
})
