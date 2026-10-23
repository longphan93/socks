import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { TranslatedType } from '../../common/types/index.js';

/** Khoá chính uuid, sinh phía ứng dụng để biết id trước khi ghi. */
export const pk = () =>
  text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/** Mốc thời gian lưu dạng chuỗi ISO của SQLite (`datetime('now')`). */
export const timestamp = () => text().notNull().default(sql`(datetime('now'))`);

/** Cột dịch được, lưu JSON `{vi, en}`. */
export const translated = () => text({ mode: 'json' }).$type<TranslatedType>();

/** Tiền: luôn là số nguyên VND, không dùng float. */
export const money = () => integer();

export const bool = () => integer({ mode: 'boolean' });
