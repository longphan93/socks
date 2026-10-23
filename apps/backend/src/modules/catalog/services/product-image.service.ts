import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MemoryCacheService } from '../../../common/cache/memory-cache.service.js';
import { LocaleEnum } from '../../../common/enums/index.js';
import { resolveTranslatedOrNull } from '../../../common/helpers/resolve-translated.helper.js';
import { StorageService } from '../../upload/services/storage.service.js';
import { CATALOG_CACHE_PREFIX } from '../constants/index.js';
import { ProductImageRepository } from '../repositories/product-image.repository.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { AttachImageDto, ReorderImagesDto } from '../http/dto/index.js';
import { ProductImageDetailResponse } from '../http/responses/index.js';

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);

  constructor(
    private readonly images: ProductImageRepository,
    private readonly products: ProductRepository,
    private readonly storage: StorageService,
    private readonly cache: MemoryCacheService,
  ) {}

  async list(productId: string, locale: LocaleEnum): Promise<ProductImageDetailResponse[]> {
    await this.assertProductExists(productId);

    const rows = await this.images.findByProduct(productId);

    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      r2Key: row.r2Key,
      alt: resolveTranslatedOrNull(row.alt, locale),
      sortOrder: row.sortOrder,
    }));
  }

  async attach(
    productId: string,
    dto: AttachImageDto,
    locale: LocaleEnum,
  ): Promise<ProductImageDetailResponse> {
    await this.assertProductExists(productId);

    // Kiểm object có thật trước khi ghi DB: client có thể gửi key bịa, hoặc
    // lần PUT lên kho chưa xong. Ghi trước rồi mới phát hiện thì sản phẩm sẽ
    // có một ảnh vỡ mà không ai biết.
    if (!(await this.storage.exists(dto.key))) {
      throw new BadRequestException('upload.object_not_found');
    }

    const existing = await this.images.findByProduct(productId);

    const row = await this.images.create({
      productId,
      r2Key: dto.key,
      url: this.storage.publicUrl(dto.key),
      alt: dto.alt,
      sortOrder: existing.length,
    });

    this.cache.invalidate(CATALOG_CACHE_PREFIX);

    return {
      id: row.id,
      url: row.url,
      r2Key: row.r2Key,
      alt: resolveTranslatedOrNull(row.alt, locale),
      sortOrder: row.sortOrder,
    };
  }

  async reorder(productId: string, dto: ReorderImagesDto): Promise<void> {
    await this.assertProductExists(productId);

    const rows = await this.images.findByProduct(productId);
    const owned = new Set(rows.map((row) => row.id));

    if (dto.ids.length !== rows.length || dto.ids.some((id) => !owned.has(id))) {
      throw new BadRequestException('catalog.image_order_mismatch');
    }

    await this.images.reorder(dto.ids);
    this.cache.invalidate(CATALOG_CACHE_PREFIX);
  }

  /** Gỡ khỏi sản phẩm và xoá luôn object, không để file rác trên kho. */
  async remove(imageId: string): Promise<void> {
    const image = await this.images.findById(imageId);

    if (!image) {
      throw new NotFoundException('upload.image_not_found');
    }

    await this.images.remove(imageId);

    try {
      await this.storage.remove(image.r2Key);
    } catch (error) {
      // Xoá trên kho hỏng thì cũng đã gỡ khỏi sản phẩm rồi; job dọn hằng ngày
      // sẽ nhặt nốt object mồ côi. Không ném lỗi để admin khỏi bấm lại vô ích.
      this.logger.warn(
        `Không xoá được object ${image.r2Key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.cache.invalidate(CATALOG_CACHE_PREFIX);
  }

  private async assertProductExists(productId: string): Promise<void> {
    if (!(await this.products.findById(productId))) {
      throw new NotFoundException('catalog.product_not_found');
    }
  }
}
