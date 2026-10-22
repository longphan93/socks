/** Một câu lệnh SQL kèm tham số, đúng dạng d1-gateway nhận. */
export interface SqlStatementInterface {
  sql: string;
  params: unknown[];
}
