import { Injectable, NotFoundException } from '@nestjs/common';
import { LocaleEnum } from '../../../common/enums/index.js';
import {
  resolveTranslated,
  resolveTranslatedOrNull,
} from '../../../common/helpers/resolve-translated.helper.js';
import { PaginatedInterface } from '../../../common/interfaces/index.js';
import { ProductFilterParamsInterface } from '../interfaces/index.js';
import { ProductRepository } from '../repositories/product.repository.js';
import {
  CategoryResponse,
  ProductDetailResponse,
  ProductImageResponse,
  ProductSummaryResponse,
  ProductVariantResponse,
} from '../http/responses/index.js';

type VariantRow = Awaited<ReturnType<ProductRepository['variantsOf']>>[number];
type ImageRow = Awaited<ReturnType<ProductRepository['imagesOf']>>[number];
type CategoryLinkRow = Awaited<ReturnType<ProductRepository['categoriesOf']>>[number];

@Injectable()
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async list(
    params: ProductFilterParamsInterface,
    locale: LocaleEnum,
  ): Promise<PaginatedInterface<ProductSummaryResponse>> {
    const page = await this.repository.list(params);
    const ids = page.items.map((item) => item.id);

    // Đọc biến thể và ảnh một lần cho cả trang thay vì mỗi sản phẩm một truy
    // vấn — mỗi lượt D1 là một request HTTPS.
    const [variants, images] = await Promise.all([
      this.repository.variantsOf(ids),
      this.repository.imagesOf(ids),
    ]);

    const variantsByProduct = groupBy(variants, (row) => row.productId);
    const imagesByProduct = groupBy(images, (row) => row.productId);

    return {
      ...page,
      items: page.items.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: resolveTranslated(product.name, locale),
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        isFeatured: product.isFeatured,
        image: (imagesByProduct.get(product.id) ?? []).map((row) => toImage(row, locale))[0] ?? null,
        variants: (variantsByProduct.get(product.id) ?? []).map((row) => toVariant(row, locale)),
      })),
    };
  }

  async findBySlug(slug: string, locale: LocaleEnum): Promise<ProductDetailResponse> {
    const product = await this.repository.findBySlug(slug);

    if (!product || !product.isActive) {
      throw new NotFoundException('catalog.product_not_found');
    }

    const [variants, images, categoryLinks] = await Promise.all([
      this.repository.variantsOf([product.id]),
      this.repository.imagesOf([product.id]),
      this.repository.categoriesOf([product.id]),
    ]);

    return {
      id: product.id,
      slug: product.slug,
      name: resolveTranslated(product.name, locale),
      description: resolveTranslatedOrNull(product.description, locale),
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      isFeatured: product.isFeatured,
      images: images.map((row) => toImage(row, locale)),
      variants: variants.map((row) => toVariant(row, locale)),
      categories: categoryLinks.map((row) => toLinkedCategory(row, locale)),
    };
  }
}

function toVariant(row: VariantRow, locale: LocaleEnum): ProductVariantResponse {
  return {
    id: row.id,
    sku: row.sku,
    size: { id: row.sizeId, value: row.sizeValue, label: resolveTranslated(row.sizeLabel, locale) },
    color: {
      id: row.colorId,
      value: row.colorValue,
      label: resolveTranslated(row.colorLabel, locale),
      hexColor: row.colorHex,
    },
    price: row.price,
    stock: row.stock,
  };
}

function toImage(row: ImageRow, locale: LocaleEnum): ProductImageResponse {
  return { id: row.id, url: row.url, alt: resolveTranslatedOrNull(row.alt, locale) };
}

function toLinkedCategory(row: CategoryLinkRow, locale: LocaleEnum): CategoryResponse {
  return {
    id: row.id,
    slug: row.slug,
    name: resolveTranslated(row.name, locale),
    group: row.group,
    description: null,
    imageUrl: null,
    isFeatured: false,
  };
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const bucket = grouped.get(key(row));

    if (bucket) bucket.push(row);
    else grouped.set(key(row), [row]);
  }

  return grouped;
}
