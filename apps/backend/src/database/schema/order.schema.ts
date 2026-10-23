import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { LocaleEnum, OrderStatusEnum } from '../../common/enums/index.js';
import { bool, money, pk, timestamp } from './columns.helper.js';

export const orders = sqliteTable(
  'orders',
  {
    id: pk(),
    /** SK-YYYYMMDD-XXXX, 4 ký tự ngẫu nhiên; trùng thì sinh lại. */
    code: text().notNull(),

    customerName: text().notNull(),
    phone: text().notNull(),
    email: text(),
    /** Hai cấp theo cải cách hành chính 2025; trống khi khách chọn ghé nhận. */
    province: text(),
    ward: text(),
    street: text(),
    note: text(),
    /** Ngôn ngữ khách dùng lúc đặt, quyết định ngôn ngữ email. */
    locale: text().$type<LocaleEnum>().notNull().default(LocaleEnum.VI),

    shippingMethodId: text().notNull(),
    subtotal: money().notNull(),
    /** Giảm giá mua nhiều, MVP do admin nhập tay sau khi gọi xác nhận. */
    discount: money().notNull().default(0),
    discountNote: text(),
    shippingFee: money().notNull().default(0),
    /**
     * Phí tạm tính: hình thức có khoảng phí (hoả tốc) thì số lúc đặt chưa phải
     * số cuối, admin chốt lại khi gọi xác nhận.
     */
    shippingFeeIsEstimate: bool().notNull().default(false),
    /** total = subtotal - discount + shippingFee */
    total: money().notNull(),

    status: text().$type<OrderStatusEnum>().notNull().default(OrderStatusEnum.PENDING_CONFIRMATION),
    internalNote: text(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  (table) => [
    uniqueIndex('orders_code_idx').on(table.code),
    index('orders_status_idx').on(table.status),
    index('orders_created_at_idx').on(table.createdAt),
    index('orders_phone_idx').on(table.phone),
  ],
);
