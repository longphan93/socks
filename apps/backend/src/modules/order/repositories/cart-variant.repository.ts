import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import { productVariants, products, variantOptions } from '../../../database/schema/index.js';

@Injectable()
export class CartVariantRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Lấy biến thể kèm tên sản phẩm và nhãn size/màu, một truy vấn cho cả giỏ. */
  findForCart(variantIds: string[]) {
    if (variantIds.length === 0) return Promise.resolve([]);

    const size = alias(variantOptions, 'size');
    const color = alias(variantOptions, 'color');

    return this.db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        price: productVariants.price,
        stock: productVariants.stock,
        isActive: productVariants.isActive,
        productId: products.id,
        productSlug: products.slug,
        productName: products.name,
        productIsActive: products.isActive,
        sizeLabel: size.label,
        colorLabel: color.label,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .innerJoin(size, eq(size.id, productVariants.sizeId))
      .innerJoin(color, eq(color.id, productVariants.colorId))
      .where(inArray(productVariants.id, variantIds));
  }
}
