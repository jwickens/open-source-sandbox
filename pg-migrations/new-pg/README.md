# New

In the new version we have made the versions, their scripts, and their schema far more explicit in order to handle more use cases while still keeping the library and as close to as "Just do SQL" as possible.

Using the db requires your SQL scripts to be organized in a certain way. It should consist of several directories each with the name of the schema postfixed with the version of the schema:

```
| project-root/
| - sql/
|   - my_schema_name-v0.0/
|     - my_table.sql
|   - my_schema_name-v0.1/
|     - my_table.sql
|     - my_table.up.sql
|     - my_table.down.sql

```

Inside each directory are the clean state setup script for that version (required) and a script to either version up from the version or version down from the next version (versions can skip, just be consistent and dont add it later). Also you can only have one schema name at a version.

To put in terms of an equation.

```
my_schema_name-v0.0/my_table.sql + my_schema_name-v0.1/my_table.up.sql = my_schema_name-v0.1/my_table.sql
```

To use the Db object do the following:

Testing is now much easier too:

```js
await db.test()
```

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

./index.html

# Limitations

First, for now we only support DB connection parameters through the standard PG* environment variables described by node-pg [here](https://node-postgres.com/features/connecting#environment-variables), so be sure to set those.

Since we use async/await and the rest sprad operator we only support Node versions 8.6 and above for now.

We only support one seek parameter for keysets.

For security reasons, raw where and order sql conditions on keysets are not encoded/decoded.

## Other projects that may interest you

The graphql community has come up with two (that we know of) libraries that do an awesome job of bridging the gap between SQL and complex clients requiring pagination.

1. postgraphql - https://github.com/postgraphql/postgraphql
2. join monster. https://github.com/stems/join-monster
