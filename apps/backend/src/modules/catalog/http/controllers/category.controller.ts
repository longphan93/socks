import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../../common/decorators/index.js';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { Public } from '../../../auth/decorators/public.decorator.js';
import { CategoryService } from '../../services/category.service.js';
import { CategoryGroupResponse, CategoryResponse } from '../responses/index.js';

@Public()
@ApiTags('Catalog - Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Category gom theo group, dùng dựng menu' })
  list(@CurrentLocale() locale: LocaleEnum): Promise<CategoryGroupResponse[]> {
    return this.categoryService.listGroupedByGroup(locale);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Category nổi bật' })
  featured(@CurrentLocale() locale: LocaleEnum): Promise<CategoryResponse[]> {
    return this.categoryService.listFeatured(locale);
  }

  @Get('current-season')
  @ApiOperation({ summary: 'Category mùa ứng với tháng hiện tại' })
  currentSeason(@CurrentLocale() locale: LocaleEnum): Promise<CategoryResponse | null> {
    return this.categoryService.currentSeason(locale);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Chi tiết một category' })
  detail(
    @Param('slug') slug: string,
    @CurrentLocale() locale: LocaleEnum,
  ): Promise<CategoryResponse> {
    return this.categoryService.findBySlug(slug, locale);
  }
}
