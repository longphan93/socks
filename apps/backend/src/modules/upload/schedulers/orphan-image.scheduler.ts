import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductImageRepository } from '../../catalog/repositories/product-image.repository.js';
import { ORPHAN_GRACE_HOURS, PRODUCT_IMAGE_PREFIX } from '../constants/index.js';
import { StorageService } from '../services/storage.service.js';

/**
 * Dọn ảnh đã upload nhưng không gắn vào sản phẩm nào.
 *
 * Xảy ra khi admin chọn ảnh rồi đóng form giữa chừng: object đã nằm trên kho
 * mà không ai tham chiếu. Chờ 24 giờ rồi mới xoá, vì ảnh vừa upload xong có
 * thể đang chờ bấm lưu.
 */
@Injectable()
export class OrphanImageScheduler {
  private readonly logger = new Logger(OrphanImageScheduler.name);

  constructor(
    private readonly storage: StorageService,
    private readonly images: ProductImageRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async sweep(): Promise<number> {
    if (!this.storage.isConfigured) return 0;

    const cutoff = Date.now() - ORPHAN_GRACE_HOURS * 60 * 60 * 1000;
    const [objects, usedKeys] = await Promise.all([
      this.storage.list(PRODUCT_IMAGE_PREFIX),
      this.images.usedKeys(),
    ]);

    const orphans = objects.filter(
      (object) =>
        !usedKeys.has(object.key) && (object.lastModified?.getTime() ?? Date.now()) < cutoff,
    );

    for (const orphan of orphans) {
      try {
        await this.storage.remove(orphan.key);
      } catch (error) {
        this.logger.warn(
          `Không xoá được ${orphan.key}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (orphans.length > 0) {
      this.logger.log(`Đã dọn ${orphans.length} ảnh không gắn với sản phẩm nào`);
    }

    return orphans.length;
  }
}
