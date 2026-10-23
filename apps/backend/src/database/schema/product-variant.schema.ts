import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { bool, money, pk } from './columns.helper.js';

export const productVariants = sqliteTable(
  'product_variants',
  {
    id: pk(),
    productId: text().notNull(),
    sku: text().notNull(),
    sizeId: text().notNull(),
    colorId: text().notNull(),
    price: money().notNull(),
    stock: integer().notNull().default(0),
    isActive: bool().notNull().default(true),
  },
  (table) => [
    uniqueIndex('product_variants_sku_idx').on(table.sku),
    index('product_variants_product_idx').on(table.productId),
    // D1 không có transaction tương tác: ràng buộc này là thứ làm batch trừ kho
    // rollback khi hàng không đủ.
    check('product_variants_stock_non_negative', sql`${table.stock} >= 0`),
  ],
);
