import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { Public } from '../../../auth/decorators/public.decorator.js';
import { OrderService } from '../../services/order.service.js';
import { OrderRateLimitService } from '../../services/order-rate-limit.service.js';
import { CreateOrderDto, ValidateCartDto } from '../dto/index.js';
import { CartValidationResponse, OrderCreatedResponse } from '../responses/index.js';

@Public()
@ApiTags('Orders')
@Controller()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly rateLimit: OrderRateLimitService,
  ) {}

  @Post('orders')
  @ApiOperation({ summary: 'Đặt hàng — không cần tài khoản' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentLocale() locale: LocaleEnum,
    @Ip() ip: string,
  ): Promise<OrderCreatedResponse> {
    this.rateLimit.assertCanOrder(ip);

    const order = await this.orderService.create(dto, locale);

    this.rateLimit.record(ip);

    return order;
  }

  @Post('cart/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kiểm giá và tồn kho mới nhất cho giỏ lưu ở trình duyệt' })
  validate(
    @Body() dto: ValidateCartDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<CartValidationResponse> {
    return this.orderService.validateCart(dto, locale);
  }
}
