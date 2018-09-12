
### Introduction

`pg-db-objects` provides simple migration solution based on pure SQL scripts run in a transaction. Since its just SQL you can add columns, remove columns, copy data from different tables to your hearts desire.

Scripts are separated into three types depending on the filename:
*  "idempotent scripts" which are run on every sync unless the desired db version matches a "snapshot script" 
* versioned snapshot which look like (*.vn.n.snap.sql). These should what an "idempotent script" was at a previous version.
* versioned migration scripts which are run only once against a remote Postgresql server.
    * pre migrations (*.vn.n.sql or *.vn.n.pre.sql)
    * post migrations (*.vn.n.post.sql)

### idempotent scripts
- are any *.sql file in your sql directory that does not have a vn.n in the file where n is an integer
- are considered to be safe and while errors are reported, they will not throw
- should be written using "if not exists" for tables and "create or replace" for functions
- should be updated with new columns even though your versioned scripts will do the same to provide a single view of table structure

### Versioned scripts:
- are any *.vn.n.(pre|post)sql file in your sql directory where n is an integer
- are run in a transaction and if an error is thrown the transaction will be rolled back and db.sync() will throw an error
- should provide migration ability using SQL commands like "alter table" or "copy to"

### Execution

The scripts are executed version groups:
1. pre-migrations, follow alphanumeric order
2. idempotent or snapshots, following alphanumeric order
3. post-migrations, following alphanumeric order

We recommend you setup your script directory as follows:

```
/sql
  - 0_my_table.sql
  - 0_my_table.v1.0.snap.sql
  - 0_my_table.v1.0.sql
  - 0_my_table.v1.5.snap.sql
  - 0_my_table.v1.5.sql
  - 1_my_functions.sql
```
In this scanario "my_functions" depends on "my_table" so we have used a preceeding digit to provide an explicit order. "my_table" has two migrations scripts. When we update from version 1.0 to version 1.5 the script "0_my_table.v1.5.sql" will run.

The "idempotent" script `0_my_table.sql` is your gold standard. Update this while developing.

### Testing

Once you are satisfied with your updated tables, create a new snapshot of the previous version by adding `.snap` to the file name of the previous version's idempotent file.

You can now use MigrationTester to test that your migration from the previous version to the new version completes sucessfuly.

We suggest you write the test which should looking something like 

```js
// TODO
const { MigrationTester } = require('pg')
const path = require('path')

const sqlDirectory = path.join(__dirname, '..', 'sql')
describe('channel service migrations', () => {
  test('from 0.7 to 0.8', async () => {
    const tester = new MigrationTester({
      sqlDirectory,
      originalVersion: 0.7,
      targetVersion: 0.8
    })
    await tester.test(expect)
  })
})
```

Before you write the migration. The output from the diff will provide valuable snippets to write the migration.
