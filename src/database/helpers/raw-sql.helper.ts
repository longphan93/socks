import { RawSqlInterface } from '../interfaces/index.js';

/** Đánh dấu một default là biểu thức SQL thay vì giá trị literal. */
export function rawSql(sql: string): RawSqlInterface {
  return { sql };
}

export function isRawSql(value: unknown): value is RawSqlInterface {
  return typeof value === 'object' && value !== null && typeof (value as RawSqlInterface).sql === 'string';
}
