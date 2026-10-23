import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { money, pk } from './columns.helper.js';

/**
 * Bản chụp tại thời điểm đặt: tên và giá giữ nguyên kể cả khi sản phẩm đổi
 * hoặc bị gỡ sau này.
 */
export const orderItems = sqliteTable(
  'order_items',
  {
    id: pk(),
    orderId: text().notNull(),
    variantId: text(),
    productName: text().notNull(),
    variantLabel: text().notNull(),
    sku: text().notNull(),
    unitPrice: money().notNull(),
    quantity: integer().notNull(),
    lineTotal: money().notNull(),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)],
);
