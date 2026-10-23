import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { EmailLogTypeEnum, OrderActivityTypeEnum } from '../../../common/enums/index.js';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import {
  emailLogs,
  orderActivities,
  orderItems,
  orders,
  productVariants,
} from '../../../database/schema/index.js';

type OrderRow = typeof orders.$inferInsert;
type OrderItemRow = typeof orderItems.$inferInsert;

@Injectable()
export class OrderRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByCode(code: string) {
    return this.db.select().from(orders).where(eq(orders.code, code)).get();
  }

  /** Tra cứu cho khách: phải khớp cả mã lẫn số điện thoại. */
  findByCodeAndPhone(code: string, phone: string) {
    return this.db
      .select()
      .from(orders)
      .where(and(eq(orders.code, code), eq(orders.phone, phone)))
      .get();
  }

  itemsOf(orderId: string) {
    return this.db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  /**
   * Tạo đơn và trừ kho trong MỘT batch nguyên tử.
   *
   * D1 không có transaction tương tác nên không thể "đọc tồn, rồi trừ": giữa
   * hai bước đó người khác có thể mua mất. Thay vào đó mỗi dòng là một
   * `stock = stock - ?` và ràng buộc `CHECK (stock >= 0)` trên bảng biến thể
   * làm trọng tài — thiếu hàng thì câu lệnh đó hỏng và **cả batch rollback**,
   * nên không bao giờ có đơn trừ được một nửa.
   */
  createWithStockDeduction(params: {
    order: OrderRow;
    items: OrderItemRow[];
    emailTypes: EmailLogTypeEnum[];
  }) {
    const { order, items, emailTypes } = params;

    const statements = [
      ...items.map((item) =>
        this.db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId!)),
      ),
      this.db.insert(orders).values(order),
      this.db.insert(orderItems).values(items),
      this.db.insert(orderActivities).values({
        orderId: order.id!,
        type: OrderActivityTypeEnum.STATUS_CHANGED,
        field: 'status',
        newValue: order.status,
        note: 'Khách đặt hàng',
      }),
      // Ghi sổ email trong cùng batch: có đơn là chắc chắn có việc phải gửi,
      // gửi hỏng thì job thử lại, chứ không mất dấu.
      this.db.insert(emailLogs).values(
        emailTypes.map((type) => ({ orderId: order.id!, type })),
      ),
    ];

    return this.db.batch(statements as unknown as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
  }
}
