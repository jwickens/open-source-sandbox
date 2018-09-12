/**
 * @flow
 */

const { GraphQlToFlow } = require('../')

describe('GraphqlToFlow', () => {
  it('should be able to run', async () => {
    const g = new GraphQlToFlow()
    expect(g).toBeDefined()
  })
})
