import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamp } from './columns.helper.js';

/** Tham số admin sửa được mà không cần deploy: kênh liên hệ, thông tin shop. */
export const settings = sqliteTable('settings', {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp(),
});
