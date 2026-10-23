/**
 * Giá trị default không phải literal mà là biểu thức SQL.
 *
 *   table.column('created_at').timestamp().default(rawSql('CURRENT_TIMESTAMP'))
 */
export interface RawSqlInterface {
  sql: string;
}
