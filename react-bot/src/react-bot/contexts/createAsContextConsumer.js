/**
 * A higher higher order component, this is the standard way to a context
 * @flow
 */

import * as React from 'react'

function createAsContextConsumer (ContextConsumer: React.ComponentType<any>, propName: string) {
  const asContextConsumer = (Component: React.ComponentType<any>) => {
    class AsContextConsumer extends React.Component<any, any> {
      // $FlowFixMe dont know how to add this to Component
      evaluate = Component.evaluate
      render () {
        return (
          <ContextConsumer>
            {(value) => {
              const passDownProps = { ...this.props, [propName]: value }
              return <Component {...passDownProps} />
            }}
          </ContextConsumer>
        )
      }
    }
    return AsContextConsumer
  }
  return asContextConsumer
}

export default createAsContextConsumer
