Depending on NODE_ENV, `Db` performs differently on setup and tear-down. This is to make developing easier so that you can write your application against "gold standard" indepotent scripts which can represent a single view of your db structure.

If you wish to override this behavior see the "override" in AppDbConstructorParams:

### DEV

In development the schema name will be schemaBase + '_development'. On `db.close()` the schema will be removed entirely from the DB. This ensures that between runs the DB state is clean. 

### TEST

In test the schema name will be schemaBase + a random integer. This will allow you to run tests parallel. On `db.close()` the schema will be removed entirely from the db.

### PROD

In production the schema name will be schemaBase. On `db.close()` the pool connection will close and the schema will be left intact.