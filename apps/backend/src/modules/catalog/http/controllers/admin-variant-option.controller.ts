import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { VariantOptionService } from '../../services/variant-option.service.js';
import { CreateVariantOptionDto, UpdateVariantOptionDto } from '../dto/index.js';
import { VariantOptionDetailResponse } from '../responses/index.js';

@ApiBearerAuth()
@ApiTags('Admin - Variant options')
@Controller('admin/variant-options')
export class AdminVariantOptionController {
  constructor(private readonly variantOptionService: VariantOptionService) {}

  @Get()
  @ApiOperation({ summary: 'Tất cả size và màu, kể cả đang ẩn' })
  list(@CurrentLocale() locale: LocaleEnum): Promise<VariantOptionDetailResponse[]> {
    return this.variantOptionService.list(locale);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm size hoặc màu' })
  create(
    @Body() dto: CreateVariantOptionDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<VariantOptionDetailResponse> {
    return this.variantOptionService.create(dto, locale);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Sửa size hoặc màu' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVariantOptionDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<VariantOptionDetailResponse> {
    return this.variantOptionService.update(id, dto, locale);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ẩn — không xoá, để biến thể cũ còn tham chiếu được' })
  deactivate(@Param('id') id: string): Promise<void> {
    return this.variantOptionService.deactivate(id);
  }
}
