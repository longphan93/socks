import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import { productImages } from '../../../database/schema/index.js';

@Injectable()
export class ProductImageRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByProduct(productId: string) {
    return this.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder));
  }

  findById(id: string) {
    return this.db.select().from(productImages).where(eq(productImages.id, id)).get();
  }

  create(value: typeof productImages.$inferInsert) {
    return this.db.insert(productImages).values(value).returning().get();
  }

  remove(id: string) {
    return this.db.delete(productImages).where(eq(productImages.id, id));
  }

  /** Đổi thứ tự cả danh sách trong một batch nguyên tử. */
  reorder(ids: string[]) {
    const statements = ids.map((id, sortOrder) =>
      this.db.update(productImages).set({ sortOrder }).where(eq(productImages.id, id)),
    );

    // `batch` của drizzle nhận tuple không rỗng; danh sách dựng động nên phải
    // khẳng định kiểu, đã chặn rỗng bằng ArrayMinSize ở DTO.
    return this.db.batch(
      statements as unknown as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]],
    );
  }

  /** Mọi r2Key đang được dùng, để job dọn biết object nào còn cần giữ. */
  async usedKeys(): Promise<Set<string>> {
    const rows = await this.db.select({ key: productImages.r2Key }).from(productImages);

    return new Set(rows.map((row) => row.key));
  }

  countByProduct(productId: string) {
    return this.db
      .select({ total: sql<number>`count(*)` })
      .from(productImages)
      .where(eq(productImages.productId, productId));
  }

  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);

    return this.db.select().from(productImages).where(inArray(productImages.id, ids));
  }
}
