import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MemoryCacheService } from '../../../common/cache/memory-cache.service.js';
import { LocaleEnum } from '../../../common/enums/index.js';
import { CATALOG_CACHE_PREFIX } from '../constants/index.js';
import { CategoryRepository } from '../repositories/category.repository.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { ProductVariantRepository } from '../repositories/product-variant.repository.js';
import { ProductService } from './product.service.js';
import { CreateProductDto, ProductVariantDto, UpdateProductDto } from '../http/dto/index.js';
import { ProductDetailResponse } from '../http/responses/index.js';

@Injectable()
export class AdminProductService {
  constructor(
    private readonly products: ProductRepository,
    private readonly variants: ProductVariantRepository,
    private readonly categoriesRepo: CategoryRepository,
    private readonly productService: ProductService,
    private readonly cache: MemoryCacheService,
  ) {}

  async create(dto: CreateProductDto, locale: LocaleEnum): Promise<ProductDetailResponse> {
    if (await this.products.findBySlug(dto.slug)) {
      throw new ConflictException('catalog.slug_taken');
    }

    await this.assertCategoriesExist(dto.categoryIds);

    const product = await this.products.create({
      name: dto.name,
      description: dto.description,
      slug: dto.slug,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
    });

    await this.products.replaceCategories(product.id, dto.categoryIds);
    await this.variants.insertMany(
      dto.variants.map((variant) => this.toVariantRow(product.id, dto.slug, variant)),
    );
    await this.products.refreshPriceRange(product.id);

    this.cache.invalidate(CATALOG_CACHE_PREFIX);

    return this.productService.findBySlug(dto.slug, locale);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    locale: LocaleEnum,
  ): Promise<ProductDetailResponse> {
    const existing = await this.products.findById(id);

    if (!existing) {
      throw new NotFoundException('catalog.product_not_found');
    }

    if (dto.slug && dto.slug !== existing.slug && (await this.products.findBySlug(dto.slug))) {
      throw new ConflictException('catalog.slug_taken');
    }

    if (dto.categoryIds) {
      await this.assertCategoriesExist(dto.categoryIds);
    }

    const product = await this.products.update(id, {
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      slug: dto.slug ?? undefined,
      isActive: dto.isActive ?? undefined,
      isFeatured: dto.isFeatured ?? undefined,
    });

    if (dto.categoryIds) {
      await this.products.replaceCategories(id, dto.categoryIds);
    }

    if (dto.variants) {
      await this.syncVariants(id, product.slug, dto.variants);
      await this.products.refreshPriceRange(id);
    }

    this.cache.invalidate(CATALOG_CACHE_PREFIX);

    return this.productService.findBySlug(product.slug, locale);
  }

  /** Ngừng bán: không xoá để đơn hàng cũ còn đọc được sản phẩm. */
  async deactivate(id: string): Promise<void> {
    if (!(await this.products.findById(id))) {
      throw new NotFoundException('catalog.product_not_found');
    }

    await this.products.update(id, { isActive: false });
    this.cache.invalidate(CATALOG_CACHE_PREFIX);
  }

  private async syncVariants(
    productId: string,
    slug: string,
    incoming: ProductVariantDto[],
  ): Promise<void> {
    const existing = await this.variants.findByProduct(productId);
    const existingIds = new Set(existing.map((row) => row.id));

    const kept = incoming.filter((variant) => variant.id && existingIds.has(variant.id));
    const added = incoming.filter((variant) => !variant.id || !existingIds.has(variant.id));

    for (const variant of kept) {
      await this.variants.update(variant.id!, {
        sizeId: variant.sizeId,
        colorId: variant.colorId,
        price: variant.price,
        stock: variant.stock,
        isActive: variant.isActive ?? true,
      });
    }

    await this.variants.insertMany(
      added.map((variant) => this.toVariantRow(productId, slug, variant)),
    );
    await this.variants.deactivateMissing(
      productId,
      kept.map((variant) => variant.id!),
    );
  }

  private toVariantRow(productId: string, slug: string, variant: ProductVariantDto) {
    return {
      productId,
      // SKU tự sinh từ slug + id size + id màu khi admin không nhập; id là uuid
      // nên lấy 8 ký tự đầu để mã còn đọc được.
      sku: variant.sku ?? `${slug}-${variant.sizeId.slice(0, 8)}-${variant.colorId.slice(0, 8)}`.toUpperCase(),
      sizeId: variant.sizeId,
      colorId: variant.colorId,
      price: variant.price,
      stock: variant.stock,
      isActive: variant.isActive ?? true,
    };
  }

  private async assertCategoriesExist(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const found = await this.categoriesRepo.findByIds(ids);

    if (found.length !== new Set(ids).size) {
      throw new BadRequestException('catalog.category_not_found');
    }
  }
}
