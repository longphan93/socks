import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { bool, money, pk, timestamp, translated } from './columns.helper.js';
import { integer } from 'drizzle-orm/sqlite-core';

export const shippingMethods = sqliteTable(
  'shipping_methods',
  {
    id: pk(),
    code: text().notNull().unique(),
    name: translated().notNull(),
    description: translated(),
    /** Mức phí hiển thị. Với hình thức phí thay đổi thì đây là mức tối thiểu. */
    fee: money().notNull().default(0),
    /**
     * Có giá trị nghĩa là phí dao động: giao diện hiện khoảng `fee`–`feeMax`
     * và ghi rõ chốt khi gọi xác nhận. Hoả tốc là trường hợp này.
     */
    feeMax: money(),
    /** Tổng hàng vượt mức này thì miễn phí giao. Null là không có ưu đãi. */
    freeFrom: money(),
    areaNote: translated(),
    estimatedTime: translated(),
    /** Khách tự tới lấy: checkout không hỏi địa chỉ giao. */
    isPickup: bool().notNull().default(false),
    sortOrder: integer().notNull().default(0),
    isActive: bool().notNull().default(true),
    createdAt: timestamp(),
  },
  (table) => [index('shipping_methods_active_idx').on(table.isActive)],
);
