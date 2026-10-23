import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { bool, money, pk, timestamp, translated } from './columns.helper.js';

export const products = sqliteTable(
  'products',
  {
    id: pk(),
    name: translated().notNull(),
    description: translated(),
    slug: text().notNull(),
    /**
     * Khoảng giá lấy từ các biến thể, tính lại mỗi khi biến thể đổi.
     *
     * Giá thật nằm ở `product_variants.price`; hai cột này là bản sao để trang
     * danh sách khỏi phải join — mỗi truy vấn D1 là một lượt gọi HTTPS nên một
     * lần join thừa trên mỗi trang là đắt.
     */
    priceMin: money().notNull().default(0),
    priceMax: money().notNull().default(0),
    isActive: bool().notNull().default(true),
    isFeatured: bool().notNull().default(false),
    createdAt: timestamp(),
  },
  (table) => [
    uniqueIndex('products_slug_idx').on(table.slug),
    index('products_active_idx').on(table.isActive),
    index('products_created_at_idx').on(table.createdAt),
  ],
);
