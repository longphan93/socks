import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { ProductImageService } from '../../services/product-image.service.js';
import { AttachImageDto, ReorderImagesDto } from '../dto/index.js';
import { ProductImageDetailResponse } from '../responses/index.js';

@ApiBearerAuth()
@ApiTags('Admin - Product images')
@Controller('admin/products/:id/images')
export class AdminProductImageController {
  constructor(private readonly productImageService: ProductImageService) {}

  @Get()
  @ApiOperation({ summary: 'Ảnh của một sản phẩm' })
  list(
    @Param('id') productId: string,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<ProductImageDetailResponse[]> {
    return this.productImageService.list(productId, locale);
  }

  @Post()
  @ApiOperation({ summary: 'Gắn ảnh đã upload vào sản phẩm' })
  attach(
    @Param('id') productId: string,
    @Body() dto: AttachImageDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<ProductImageDetailResponse> {
    return this.productImageService.attach(productId, dto, locale);
  }

  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đổi thứ tự ảnh' })
  reorder(@Param('id') productId: string, @Body() dto: ReorderImagesDto): Promise<void> {
    return this.productImageService.reorder(productId, dto);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Gỡ ảnh khỏi sản phẩm và xoá object trên kho' })
  remove(@Param('imageId') imageId: string): Promise<void> {
    return this.productImageService.remove(imageId);
  }
}
