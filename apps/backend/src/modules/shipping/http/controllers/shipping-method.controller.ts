import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { Public } from '../../../auth/decorators/public.decorator.js';
import { ShippingMethodService } from '../../services/shipping-method.service.js';
import { ShippingMethodResponse } from '../responses/index.js';

@Public()
@ApiTags('Shipping')
@Controller('shipping-methods')
export class ShippingMethodController {
  constructor(private readonly shippingMethodService: ShippingMethodService) {}

  @Get()
  @ApiOperation({ summary: 'Các hình thức nhận hàng đang mở, dùng dựng bước checkout' })
  list(@CurrentLocale() locale: LocaleEnum): Promise<ShippingMethodResponse[]> {
    return this.shippingMethodService.listActive(locale);
  }
}
