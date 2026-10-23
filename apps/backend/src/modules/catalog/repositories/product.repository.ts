import { Inject, Injectable } from '@nestjs/common';
import { SQL, and, asc, between, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { PaginatedInterface } from '../../../common/interfaces/index.js';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import {
  categories,
  productCategories,
  productImages,
  productVariants,
  products,
  variantOptions,
} from '../../../database/schema/index.js';
import { ProductSortEnum } from '../enums/index.js';
import { ProductFilterParamsInterface } from '../interfaces/index.js';

@Injectable()
export class ProductRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(
    params: ProductFilterParamsInterface,
  ): Promise<PaginatedInterface<typeof products.$inferSelect>> {
    const { page, limit } = params;
    const where = and(eq(products.isActive, true), ...this.buildFilters(params));

    const [{ total }] = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(products)
      .where(where);

    const items = await this.db
      .select()
      .from(products)
      .where(where)
      .orderBy(...this.buildOrder(params.sort))
      .limit(limit)
      .offset((page - 1) * limit);

    return { items, total, page, limit };
  }

  findBySlug(slug: string) {
    return this.db.select().from(products).where(eq(products.slug, slug)).get();
  }

  findById(id: string) {
    return this.db.select().from(products).where(eq(products.id, id)).get();
  }

  /** Biến thể kèm nhãn size và màu, đọc một lần cho nhiều sản phẩm. */
  variantsOf(productIds: string[]) {
    if (productIds.length === 0) return Promise.resolve([]);

    // Join variant_options hai lần nên mỗi lần cần một bí danh riêng.
    const size = alias(variantOptions, 'size');
    const color = alias(variantOptions, 'color');

    return this.db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        price: productVariants.price,
        stock: productVariants.stock,
        sizeId: size.id,
        sizeValue: size.value,
        sizeLabel: size.label,
        colorId: color.id,
        colorValue: color.value,
        colorLabel: color.label,
        colorHex: color.hexColor,
      })
      .from(productVariants)
      .innerJoin(size, eq(size.id, productVariants.sizeId))
      .innerJoin(color, eq(color.id, productVariants.colorId))
      .where(
        and(inArray(productVariants.productId, productIds), eq(productVariants.isActive, true)),
      )
      .orderBy(asc(size.sortOrder), asc(color.sortOrder));
  }

  imagesOf(productIds: string[]) {
    if (productIds.length === 0) return Promise.resolve([]);

    return this.db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder));
  }

  categoriesOf(productIds: string[]) {
    if (productIds.length === 0) return Promise.resolve([]);

    return this.db
      .select({
        productId: productCategories.productId,
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        group: categories.group,
      })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(inArray(productCategories.productId, productIds))
      .orderBy(asc(productCategories.sortOrder));
  }

  create(value: typeof products.$inferInsert) {
    return this.db.insert(products).values(value).returning().get();
  }

  update(id: string, changes: Partial<typeof products.$inferInsert>) {
    return this.db.update(products).set(changes).where(eq(products.id, id)).returning().get();
  }

  /** Gán lại toàn bộ category của một sản phẩm trong một batch nguyên tử. */
  replaceCategories(productId: string, categoryIds: string[]) {
    const remove = this.db
      .delete(productCategories)
      .where(eq(productCategories.productId, productId));

    if (categoryIds.length === 0) return this.db.batch([remove]);

    return this.db.batch([
      remove,
      this.db
        .insert(productCategories)
        .values(categoryIds.map((categoryId, sortOrder) => ({ productId, categoryId, sortOrder }))),
    ]);
  }

  /** Đồng bộ lại khoảng giá sau khi biến thể đổi. */
  async refreshPriceRange(productId: string): Promise<void> {
    const [range] = await this.db
      .select({
        min: sql<number | null>`min(${productVariants.price})`,
        max: sql<number | null>`max(${productVariants.price})`,
      })
      .from(productVariants)
      .where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)));

    await this.db
      .update(products)
      .set({ priceMin: range?.min ?? 0, priceMax: range?.max ?? 0 })
      .where(eq(products.id, productId));
  }

  private buildFilters(params: ProductFilterParamsInterface): SQL[] {
    const filters: SQL[] = [];

    if (params.featuredOnly) filters.push(eq(products.isFeatured, true));

    if (params.search) {
      // SQLite LIKE không phân biệt hoa thường với ký tự ASCII; dấu tiếng Việt
      // vẫn phải gõ đúng. Thoát % và _ để người dùng gõ chúng không thành ký tự đại diện.
      const term = params.search.replace(/[%_\\]/g, (match) => `\\${match}`);
      filters.push(sql`${products.name} like ${`%${term}%`} escape '\\'`);
    }

    if (params.minPrice !== undefined && params.maxPrice !== undefined) {
      filters.push(between(products.priceMin, params.minPrice, params.maxPrice));
    } else if (params.minPrice !== undefined) {
      filters.push(gte(products.priceMax, params.minPrice));
    } else if (params.maxPrice !== undefined) {
      filters.push(lte(products.priceMin, params.maxPrice));
    }

    const categorySlugs = params.categorySlugs?.filter(Boolean) ?? [];

    if (categorySlugs.length > 0) {
      // Nhiều category nghĩa là GIAO, không phải HỢP: chọn "Đông" và "Nam" thì
      // khách muốn tất mùa đông CHO nam, không phải tất cả tất đông cộng tất nam.
      // HAVING đếm đủ số slug chính là phép giao đó.
      filters.push(sql`${products.id} in (
        select ${productCategories.productId}
        from ${productCategories}
        inner join ${categories} on ${categories.id} = ${productCategories.categoryId}
        where ${inArray(categories.slug, categorySlugs)}
        group by ${productCategories.productId}
        having count(distinct ${categories.id}) = ${categorySlugs.length}
      )`);
    }

    for (const [values, kind] of [
      [params.sizes, 'size_id'],
      [params.colors, 'color_id'],
    ] as const) {
      const picked = values?.filter(Boolean) ?? [];

      if (picked.length === 0) continue;

      // Size và màu là phép HỢP: chọn nhiều size nghĩa là còn bất kỳ size nào
      // trong đó cũng được.
      filters.push(sql`${products.id} in (
        select ${productVariants.productId}
        from ${productVariants}
        inner join ${variantOptions} on ${variantOptions.id} = ${sql.raw(`product_variants.${kind}`)}
        where ${inArray(variantOptions.value, picked)} and ${productVariants.isActive} = 1
      )`);
    }

    return filters;
  }

  private buildOrder(sort: ProductSortEnum): SQL[] {
    switch (sort) {
      case ProductSortEnum.PRICE_ASC:
        return [asc(products.priceMin)];
      case ProductSortEnum.PRICE_DESC:
        return [desc(products.priceMax)];
      case ProductSortEnum.NAME_ASC:
        return [asc(products.name)];
      default:
        return [desc(products.createdAt), desc(products.id)];
    }
  }
}
