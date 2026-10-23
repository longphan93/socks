import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { AdminProductService } from '../../services/admin-product.service.js';
import { CreateProductDto, UpdateProductDto } from '../dto/index.js';
import { ProductDetailResponse } from '../responses/index.js';

@ApiBearerAuth()
@ApiTags('Admin - Products')
@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo sản phẩm kèm biến thể và category' })
  create(
    @Body() dto: CreateProductDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<ProductDetailResponse> {
    return this.adminProductService.create(dto, locale);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Sửa sản phẩm, gán lại category và biến thể' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<ProductDetailResponse> {
    return this.adminProductService.update(id, dto, locale);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ngừng bán — không xoá, để đơn cũ còn đọc được' })
  deactivate(@Param('id') id: string): Promise<void> {
    return this.adminProductService.deactivate(id);
  }
}
