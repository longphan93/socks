import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import { productVariants } from '../../../database/schema/index.js';

@Injectable()
export class ProductVariantRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByProduct(productId: string) {
    return this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
  }

  insertMany(values: (typeof productVariants.$inferInsert)[]) {
    if (values.length === 0) return Promise.resolve();

    return this.db.insert(productVariants).values(values);
  }

  update(id: string, changes: Partial<typeof productVariants.$inferInsert>) {
    return this.db.update(productVariants).set(changes).where(eq(productVariants.id, id));
  }

  /**
   * Tắt các biến thể không còn trong danh sách gửi lên thay vì xoá.
   *
   * Xoá sẽ làm đơn hàng cũ mất tham chiếu biến thể; tắt thì lịch sử đơn vẫn
   * đọc được mà khách không mua được nữa.
   */
  deactivateMissing(productId: string, keepIds: string[]) {
    const scope =
      keepIds.length > 0
        ? and(eq(productVariants.productId, productId), notInArray(productVariants.id, keepIds))
        : eq(productVariants.productId, productId);

    return this.db.update(productVariants).set({ isActive: false }).where(scope);
  }

  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);

    return this.db.select().from(productVariants).where(inArray(productVariants.id, ids));
  }
}
