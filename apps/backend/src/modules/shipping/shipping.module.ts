import { Global, Module } from '@nestjs/common';
import { ShippingMethodController } from './http/controllers/shipping-method.controller.js';
import { ShippingMethodRepository } from './repositories/shipping-method.repository.js';
import { ShippingMethodService } from './services/shipping-method.service.js';

/** Global vì module đơn hàng cần tính phí ship khi tạo đơn. */
@Global()
@Module({
  controllers: [ShippingMethodController],
  providers: [ShippingMethodRepository, ShippingMethodService],
  exports: [ShippingMethodService, ShippingMethodRepository],
})
export class ShippingModule {}
