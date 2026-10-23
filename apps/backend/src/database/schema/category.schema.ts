import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { CategoryGroupEnum } from '../../common/enums/index.js';
import { bool, pk, timestamp, translated } from './columns.helper.js';

export const categories = sqliteTable(
  'categories',
  {
    id: pk(),
    name: translated().notNull(),
    description: translated(),
    /** Một slug dùng chung cho mọi ngôn ngữ, vì URL đã quy ước tiếng Anh. */
    slug: text().notNull(),
    group: text().$type<CategoryGroupEnum>().notNull(),
    imageUrl: text(),
    sortOrder: integer().notNull().default(0),
    isActive: bool().notNull().default(true),
    isFeatured: bool().notNull().default(false),
    createdAt: timestamp(),
  },
  (table) => [
    uniqueIndex('categories_slug_idx').on(table.slug),
    index('categories_group_idx').on(table.group),
  ],
);
