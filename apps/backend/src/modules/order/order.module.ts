import { Module } from '@nestjs/common';
import { OrderController } from './http/controllers/order.controller.js';
import { CartVariantRepository } from './repositories/cart-variant.repository.js';
import { OrderRepository } from './repositories/order.repository.js';
import { OrderRateLimitService } from './services/order-rate-limit.service.js';
import { OrderService } from './services/order.service.js';

@Module({
  controllers: [OrderController],
  providers: [OrderRepository, CartVariantRepository, OrderService, OrderRateLimitService],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
