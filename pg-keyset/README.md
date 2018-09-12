# Keyset queries for PG 🗝

PG Keyset is a highly specialized library built on top of the highly popular `node-pg` that allows efficient paginated queries for postgres. It provides results following the GraphQL "connection" format which uses cursors to allow clients to get previous or next results from any row returned.

* Keyset: a set of conditions to provide a deterministic order to a SQL query in addition to a "seek" condition that limits the query to the page desired.
* Seek: a method of pagination with SQL databases that uses "where" and "order by" clauses to "seek" to the required data.
* Cursor: an opaque string associated with a single returned result that can be decoded by PG Keyset and used to get further results

# Other solutions

1. SQL commands OFFSET and LIMIT

While its true you can use these commands for pagination, each new page of data retrieved will be incrementally slower. This is because the database has to count rows from the beginning of the query and then exclude any entries before the offset, making further pages seek out more and more information.

You can read more about why this method does not perform well in this excellent article: https://use-the-index-luke.com/sql/partial-results/fetch-next-page

It also explains really well how the seek method for pagination works in SQL.

If your use-case requires only getting the next page of data in very limited cases then you can probably fallback to the OFFSET and LIMIT commands. If your use case includes providing scrollable lists to users then you should really ensure your solution uses one of the methods discussed in the article above.

Also note that ORM's for Nodejs like Bookshelf and Sequelize use this method for pagination:
* https://github.com/bookshelf/bookshelf/wiki/Plugin:-Pagination
* http://docs.sequelizejs.com/manual/tutorial/querying.html#pagination-limiting

2. PostgraphQL

This is a really cool project that auto-generates a GraphQL service from a postgres DB https://github.com/postgraphql/postgraphql. It suppports paginated queries out of the box. If you just want pagination however, or don't want the other other features that PosgraphQL provides (like perhaps you want to transform the data with your application first) then perhaps you should consider PG-Cursor.

3. Join Monster

Join monster is another great project that turns a graphql query into a SQL query and supports paginated queries out of the box. Like PostgraphQL however, if you want to have custom application logic between your DB and what goes to the front end then you should consider pg-cursor

https://github.com/stems/join-monster
