import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { CategoryGroupEnum } from '../../../common/enums/index.js';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import { categories, productCategories } from '../../../database/schema/index.js';

@Injectable()
export class CategoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAllActive() {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.slug));
  }

  findAll() {
    return this.db
      .select()
      .from(categories)
      .orderBy(asc(categories.group), asc(categories.sortOrder));
  }

  findBySlug(slug: string) {
    return this.db.select().from(categories).where(eq(categories.slug, slug)).get();
  }

  findById(id: string) {
    return this.db.select().from(categories).where(eq(categories.id, id)).get();
  }

  findByGroup(group: CategoryGroupEnum) {
    return this.db
      .select()
      .from(categories)
      .where(and(eq(categories.group, group), eq(categories.isActive, true)))
      .orderBy(asc(categories.sortOrder));
  }

  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);

    return this.db.select().from(categories).where(inArray(categories.id, ids));
  }

  create(value: typeof categories.$inferInsert) {
    return this.db.insert(categories).values(value).returning().get();
  }

  update(id: string, changes: Partial<typeof categories.$inferInsert>) {
    return this.db.update(categories).set(changes).where(eq(categories.id, id)).returning().get();
  }

  /**
   * Xoá category: gỡ liên kết trước rồi mới xoá, trong một batch nguyên tử.
   *
   * Sản phẩm KHÔNG bị xoá theo — một sản phẩm thường thuộc nhiều category, xoá
   * nhóm "Quà Tết" không có nghĩa là ngừng bán đôi tất đó.
   */
  deleteWithLinks(id: string) {
    return this.db.batch([
      this.db.delete(productCategories).where(eq(productCategories.categoryId, id)),
      this.db.delete(categories).where(eq(categories.id, id)),
    ]);
  }
}
