/**
 * @flow
 * @ignore
**/
import type { PoolClient, ResultSet, Row } from './Db.types'

const pgFormat = require('pg-format')
const Db = require('./Db')
const Keyset = require('./Keyset')
const { wrapTransactionOptional } = require('./util')

type Column = {
  dataType: string,
  columnName: string,
  arrayDataType: string,
  camelName: string
}
/**
 * Parameters for constructing a table
 */
type TableConstructorParams = {
  db: Db,
  tableName: string
}
/**
 * A helper object for quering table properties. The easiest way to construct is from from Db.getTable
 */
class Table {
  db: Db
  name: string
  columns: Column[]
  idColumn: string
  isInitialized: Promise<boolean>

  constructor (params: TableConstructorParams) {
    const {db, tableName} = params
    this.db = db
    this.name = tableName
    this.isInitialized = this.__init()
  }

  // given a list of fields in camelcase, return corresponding columns
  async __safeColumns (fields: string[]): Promise<Column[]> {
    await this.isInitialized
    return this.columns.filter(col => fields.indexOf(col.camelName) > -1)
  }

  __escape (value: any, col: Column) {
    if (col.dataType === 'ARRAY') {
      if (value.length === 0) {
        return "'{}'"
      } else {
        return pgFormat(`Array[%L]::${col.arrayDataType}[]`, value)
      }
    } else {
      return pgFormat('%L', value)
    }
  }

  __insertSql (record: Row, columns: Column[]): string {
    const values = columns
      .map(column => {
        const value = record[column.camelName]
        return this.__escape(value, column)
      })

    return pgFormat(`
      insert into %I as d (${columns.map(col => col.columnName).join(', ')})
      values (${values.join(',')})
    `, this.name)
  }

  __updateSql (record: {id: string, [col: string]: any}, columns: Column[], excluded?: boolean): string {
    const values = columns
      .map(column => {
        const { columnName, camelName } = column
        const value = record[camelName]
        // if value is null this is an explicit attempt to clear
        if (value === null) {
          return `${columnName} = null`
        }
        // otherwise coalesce with its existing value
        return `${columnName} = COALESCE(${this.__escape(value, column)}, ${excluded ? 'excluded.' : ''}${columnName})`
      })
    return pgFormat(`
        set ${values.join(', ')}
        where d.id = %L
      `, record.id)
  }

  async getById (recordId: string, client: ?PoolClient): Promise<Row> {
    await this.isInitialized
    return wrapTransactionOptional(this.db, client, async client => {
      const results: ResultSet = await client.query(`
        select * from ${this.name}
        where id = ${recordId} 
      `)
      return results.rows[0]
    })
  }

  async delete (recordId: string, client: ?PoolClient): Row {
    await this.isInitialized
    return wrapTransactionOptional(this.db, client, async client => {
      const results: ResultSet = await client.query(`
        delete from ${this.name}
        where id = ${recordId}
        returning *
      `)
      return results.rows[0]
    })
  }

  /**
   * Insert a new row
   */
  async insert (record: Row, client: ?PoolClient): Row {
    await this.isInitialized
    return wrapTransactionOptional(this.db, client, async client => {
      const fields = Object.keys(record)
      const columns = await this.__safeColumns(fields)
      if (columns.length === 0) {
        throw new Error(`no valid columns to insert on ${this.name}`)
      }
      const results: ResultSet = await client.query(`
        ${this.__insertSql(record, columns)}
        returning *
      `)
      return results.rows[0]
    })
  }

  /**
   * Update an existing row. Only supports id for finding row to update for now.
   */
  async update (record: {id: string, [col: string]: any}, client: ?PoolClient): Row {
    return wrapTransactionOptional(this.db, client, async client => {
      const fields = Object.keys(record)
      const columns = await this.__safeColumns(fields)
      const results: ResultSet = await client.query(pgFormat(`
          update %I as d
          ${this.__updateSql(record, columns)}
          returning *
        `, this.name))
      return results.rows[0]
    })
  }

  /**
   * Upsert a row. Only supports id constraint errors for now.
   */
  async upsert (record: {[string]: any}, client: ?PoolClient): Row {
    if (!record.id) {
      return this.insert(record)
    }
    return wrapTransactionOptional(this.db, client, async client => {
      const fields = Object.keys(record)
      const columns = await this.__safeColumns(fields)
      const nonIdColumns = columns.filter(f => f.columnName !== 'id')
      if (nonIdColumns.length === 0) {
        throw new Error(`no fields to update for upsert on ${this.name}. Are you sure that you are using the right table and or fields? Is your js camalcased and your sql snake cased?`)
      }
      const updateQuery = this.__updateSql(record, nonIdColumns, true)
      const insertQuery = this.__insertSql(record, columns)
      const query = pgFormat(`
      ${insertQuery}
      on conflict (id) do update
      ${updateQuery}
      returning *
      `, this.name)
      const results: ResultSet = await client.query(query)
      return results.rows[0]
    })
  }

  // Add xxxxRecord methods in order to add support for pg-models BaseModel
  // to operate with both OrgScopedTable and Table
  async deleteRecord ({ id }: { id: string }, client: ?PoolClient): Row {
    return this.delete(id, client)
  }

  async getRecord({ id }: { id: string }, client: ?PoolClient): Row {
    return this.getById(id, client)
  }

  async insertRecord(record: Row, client: ?PoolClient): Row {
    return this.insert(record, client)
  }

  async updateRecord(record: {id: string, [col: string]: any}, client: ?PoolClient): Row {
    return this.update(record, client)
  }

  async upsertRecord(record: {[string]: any}, client: ?PoolClient): Row {
    return this.upsert(record, client)
  }

  /**
   * get a keyset instance for working with this table
   */
  getKeyset (): Keyset {
    const keyset = new Keyset({db: this.db, table: this})
    return keyset
  }
  /**
   * get the columns from the table as an array of strings
   */
  async getColumns ({types = false}: {types?: boolean} = {}): Promise<Column[]> {
    const query = pgFormat(`
      SELECT c.column_name, c.data_type, e.udt_name as array_data_type
      FROM information_schema.columns c LEFT JOIN information_schema.element_types e
      ON ((c.table_catalog, c.table_schema, c.table_name, 'TABLE', c.dtd_identifier)
        = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier))
      WHERE c.table_schema = %L
        AND c.table_name = %L
      `, this.db.schemaName, this.name)
    const { rows } = await this.db.query(query)
    // $FlowFixMe cheap type cast
    this.columns = rows.map(row => ({...row, camelName: snakeToCamel(row.columnName)}))
    return this.columns
  }

  async __init () {
    await this.db.isInitialized
    await this.getColumns()
    return true
  }
}

function snakeToCamel (word: string): string {
  return word.replace(/(_\w)/g, (match) => match[1].toUpperCase())
}

module.exports = Table
