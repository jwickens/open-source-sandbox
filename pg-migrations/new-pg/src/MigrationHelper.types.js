/**
 * @flow
 */

export type SqlFile = {
  filename: string,
  contents: string
}

type AnnotatedSqlFileBase = {
}

export type SqlFileType =
  'idempotent' |
  'pre' |
  'post' |
  'snap'

export type AnnotatedSqlFile = AnnotatedSqlFileBase & {
  filename: string,
  baseName: string,
  contents: string,
  version: ?number,
  type: SqlFileType
}

export type MigrationsInfo = {
  version: number,
  idempotents: AnnotatedSqlFile[],
  preMigrations: AnnotatedSqlFile[],
  postMigrations: AnnotatedSqlFile[],
  snapshots: AnnotatedSqlFile[]
}
