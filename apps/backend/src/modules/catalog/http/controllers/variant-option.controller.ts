import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { Public } from '../../../auth/decorators/public.decorator.js';
import { VariantOptionService } from '../../services/variant-option.service.js';
import { VariantOptionDetailResponse } from '../responses/index.js';

@Public()
@ApiTags('Catalog - Variant options')
@Controller('variant-options')
export class VariantOptionController {
  constructor(private readonly variantOptionService: VariantOptionService) {}

  @Get()
  @ApiOperation({ summary: 'Size và màu đang bật, dùng dựng bộ lọc' })
  list(@CurrentLocale() locale: LocaleEnum): Promise<VariantOptionDetailResponse[]> {
    return this.variantOptionService.list(locale, true);
  }
}
