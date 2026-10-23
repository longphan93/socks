import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { AdminCategoryService } from '../../services/admin-category.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/index.js';
import { CategoryResponse } from '../responses/index.js';

@ApiBearerAuth()
@ApiTags('Admin - Categories')
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly adminCategoryService: AdminCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Tất cả category, kể cả đang tắt' })
  list(@CurrentLocale() locale: LocaleEnum): Promise<CategoryResponse[]> {
    return this.adminCategoryService.list(locale);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo category' })
  create(
    @Body() dto: CreateCategoryDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<CategoryResponse> {
    return this.adminCategoryService.create(dto, locale);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Sửa category' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<CategoryResponse> {
    return this.adminCategoryService.update(id, dto, locale);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá category — chỉ gỡ liên kết, sản phẩm vẫn còn' })
  remove(@Param('id') id: string): Promise<void> {
    return this.adminCategoryService.remove(id);
  }
}
