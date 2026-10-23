import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { VariantOptionKindEnum } from '../../../common/enums/index.js';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import { productVariants, variantOptions } from '../../../database/schema/index.js';

@Injectable()
export class VariantOptionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAll(onlyActive = false) {
    const scope = onlyActive ? eq(variantOptions.isActive, true) : undefined;

    return this.db
      .select()
      .from(variantOptions)
      .where(scope)
      .orderBy(asc(variantOptions.kind), asc(variantOptions.sortOrder));
  }

  findById(id: string) {
    return this.db.select().from(variantOptions).where(eq(variantOptions.id, id)).get();
  }

  findByKindAndValue(kind: VariantOptionKindEnum, value: string) {
    return this.db
      .select()
      .from(variantOptions)
      .where(and(eq(variantOptions.kind, kind), eq(variantOptions.value, value)))
      .get();
  }

  create(value: typeof variantOptions.$inferInsert) {
    return this.db.insert(variantOptions).values(value).returning().get();
  }

  update(id: string, changes: Partial<typeof variantOptions.$inferInsert>) {
    return this.db
      .update(variantOptions)
      .set(changes)
      .where(eq(variantOptions.id, id))
      .returning()
      .get();
  }

  /** Đếm biến thể đang dùng tuỳ chọn này, để chặn xoá thứ đang có hàng. */
  async countUsage(id: string): Promise<number> {
    const rows = await this.db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.isActive, true),
          // Một tuỳ chọn có thể đứng ở vai size hoặc màu.
          eq(productVariants.sizeId, id),
        ),
      );

    const asColor = await this.db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(and(eq(productVariants.isActive, true), eq(productVariants.colorId, id)));

    return rows.length + asColor.length;
  }
}
