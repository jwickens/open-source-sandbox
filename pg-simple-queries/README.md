
**Warning: This library is in pre-release and the API will likely be changed with minor versions until we reach a 1.0.0 release**

# Features

- Automatic Camelcasing
- Multiple-instance-safe migrations. Only one instance will perform migrations  
- Wrapped `pg` query object for consistent logging
- Schema lifecycle management tied to NODE_ENV for dev, test and prod
- Keyset query support, based on the graphql connection model

# Usage

```
yarn add pg-db-objects
```

```javascript
const { Db } = require('pg-db-objects')
const path = require('path')

// setup your DB, providing path to a SQL directory, it will be recursively searched for **/*.sql files
const db = new Db({sqlDirectory: path.join(__dirname, 'sql')})

// perform any necessary migrations to bring the DB up to spec
await db.sync()

// make a simple query with pure SQL
const { rows } = await db.query(`select columns from normal_sql_land`)

// produce a paginated result with cursors using the keyset helper
const keyset = db.getTable('pagination_land').getKeyset()

// if you have a cursor from a previous use that
const {edges, pageInfo} = await keyset.start({field: 'seq', first: 12}).query()
// edges[0].cursor = 'a_very_opaque-cursor'

// if you have a cursor from a previous use that
const {edges, pageInfo} = await keyset.continue({from: 'a_very_opaque_cursor', prev: 12}).query()

// close the DB
await db.close()
```

# Docs 

Please see ./index.html
# Limitations

First, for now we only support DB connection parameters through the standard PG* environment variables described by node-pg [here](https://node-postgres.com/features/connecting#environment-variables), so be sure to set those.

Since we use async/await and the rest sprad operator we only support Node versions 8.6 and above for now.

We only support one seek parameter for keysets.

For security reasons, raw where and order sql conditions on keysets are not encoded/decoded.

## Other projects that may interest you

The graphql community has come up with two (that we know of) libraries that do an awesome job of bridging the gap between SQL and complex clients requiring pagination.

1. postgraphql - https://github.com/postgraphql/postgraphql
2. join monster. https://github.com/stems/join-monster
