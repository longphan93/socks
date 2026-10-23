import { getTableColumns } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { D1_MAX_BOUND_PARAMS } from '../constants/index.js';

/**
 * Chạy insert hàng loạt theo từng lô vừa với giới hạn tham số bind của D1.
 *
 * Số dòng mỗi lô tính từ số cột của bảng, vì Drizzle sinh một placeholder cho
 * mỗi cột của mỗi dòng.
 */
export async function insertInChunks<TRow>(
  table: SQLiteTable,
  rows: TRow[],
  insert: (chunk: TRow[]) => Promise<unknown>,
): Promise<void> {
  if (rows.length === 0) return;

  const columnCount = Object.keys(getTableColumns(table)).length;
  const perStatement = Math.max(1, Math.floor(D1_MAX_BOUND_PARAMS / columnCount));

  for (let index = 0; index < rows.length; index += perStatement) {
    await insert(rows.slice(index, index + perStatement));
  }
}
