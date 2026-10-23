import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { AdminProductService } from '../../services/admin-product.service.js';
import { Respond, respond } from '../../../../common/dto/api-response.dto.js';
import { paginationMeta } from '../../../../common/helpers/paginate.helper.js';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from '../dto/index.js';
import { ProductDetailResponse, ProductSummaryResponse } from '../responses/index.js';

@ApiBearerAuth()
@ApiTags('Admin - Products')
@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm, gồm cả hàng đã tắt' })
  async list(
    @Query() query: ListProductsQueryDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<Respond<ProductSummaryResponse[]>> {
    const page = await this.adminProductService.list(
      {
        categorySlugs: query.category,
        search: query.search,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        sizes: query.size,
        colors: query.color,
        sort: query.sort,
        page: query.page,
        limit: query.limit,
      },
      locale,
    );

    return respond(page.items, { meta: paginationMeta(page) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo id, kể cả đã tắt' })
  detail(
    @Param('id') id: string,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<ProductDetailResponse> {
    return this.adminProductService.findById(id, locale);
  }

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
