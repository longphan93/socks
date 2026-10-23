import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { Respond, respond } from '../../../../common/dto/api-response.dto.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { paginationMeta } from '../../../../common/helpers/paginate.helper.js';
import { Public } from '../../../auth/decorators/public.decorator.js';
import { ProductService } from '../../services/product.service.js';
import { ListProductsQueryDto } from '../dto/index.js';
import { ProductDetailResponse, ProductSummaryResponse } from '../responses/index.js';

@Public()
@ApiTags('Catalog - Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm, lọc và phân trang' })
  async list(
    @Query() query: ListProductsQueryDto,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<Respond<ProductSummaryResponse[]>> {
    const page = await this.productService.list(
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

  @Get(':slug')
  @ApiOperation({ summary: 'Chi tiết sản phẩm kèm biến thể, ảnh, category' })
  detail(
    @Param('slug') slug: string,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<ProductDetailResponse> {
    return this.productService.findBySlug(slug, locale);
  }
}
