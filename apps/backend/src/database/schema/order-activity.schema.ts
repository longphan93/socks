import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { OrderActivityTypeEnum } from '../../common/enums/index.js';
import { pk, timestamp } from './columns.helper.js';

/**
 * Nhật ký của một đơn: đổi trạng thái, sửa phí ship, nhập giảm giá, ghi chú.
 *
 * Gộp một bảng thay vì chỉ ghi lịch sử trạng thái, vì phí ship và giảm giá đều
 * do admin sửa tay sau cuộc gọi xác nhận — có tranh cãi thì phải tra được ai
 * đổi, lúc nào, từ bao nhiêu sang bao nhiêu.
 */
export const orderActivities = sqliteTable(
  'order_activities',
  {
    id: pk(),
    orderId: text().notNull(),
    type: text().$type<OrderActivityTypeEnum>().notNull(),
    /** Tên trường bị đổi với loại SHIPPING_FEE_CHANGED / DISCOUNT_CHANGED. */
    field: text(),
    oldValue: text(),
    newValue: text(),
    note: text(),
    changedBy: text(),
    createdAt: timestamp(),
  },
  (table) => [index('order_activities_order_idx').on(table.orderId)],
);
