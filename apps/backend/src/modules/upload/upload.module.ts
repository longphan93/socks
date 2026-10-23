import { Global, Module, forwardRef } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { AdminUploadController } from './http/controllers/admin-upload.controller.js';
import { OrphanImageScheduler } from './schedulers/orphan-image.scheduler.js';
import { StorageService } from './services/storage.service.js';
import { UploadService } from './services/upload.service.js';

/**
 * Global vì module catalog cũng cần `StorageService` để xoá object khi gỡ ảnh
 * khỏi sản phẩm.
 */
@Global()
@Module({
  // Catalog cần StorageService để xoá object, còn job dọn cần repository ảnh
  // của catalog — hai chiều nên phải forwardRef.
  imports: [forwardRef(() => CatalogModule)],
  controllers: [AdminUploadController],
  providers: [StorageService, UploadService, OrphanImageScheduler],
  exports: [StorageService],
})
export class UploadModule {}
