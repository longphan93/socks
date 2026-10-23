import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { pk, timestamp, translated } from './columns.helper.js';

export const productImages = sqliteTable(
  'product_images',
  {
    id: pk(),
    productId: text().notNull(),
    r2Key: text().notNull(),
    url: text().notNull(),
    alt: translated(),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp(),
  },
  (table) => [index('product_images_product_idx').on(table.productId)],
);
