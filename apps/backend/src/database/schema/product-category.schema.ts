import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Bảng nối many-to-many tường minh: một product thuộc nhiều category. */
export const productCategories = sqliteTable(
  'product_categories',
  {
    productId: text().notNull(),
    categoryId: text().notNull(),
    sortOrder: integer().notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index('product_categories_category_idx').on(table.categoryId),
  ],
);
