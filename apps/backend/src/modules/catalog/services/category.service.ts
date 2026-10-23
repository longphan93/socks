import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemoryCacheService } from '../../../common/cache/memory-cache.service.js';
import { CategoryGroupEnum, LocaleEnum } from '../../../common/enums/index.js';
import { currentSeasonSlug } from '../../../common/helpers/current-season.helper.js';
import {
  resolveTranslated,
  resolveTranslatedOrNull,
} from '../../../common/helpers/resolve-translated.helper.js';
import { Env } from '../../../config/env.js';
import { categories } from '../../../database/schema/index.js';
import { CATEGORY_LIST_CACHE_KEY } from '../constants/index.js';
import { CategoryRepository } from '../repositories/category.repository.js';
import { CategoryGroupResponse, CategoryResponse } from '../http/responses/index.js';

type CategoryRow = typeof categories.$inferSelect;

@Injectable()
export class CategoryService {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly cache: MemoryCacheService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async listGroupedByGroup(locale: LocaleEnum): Promise<CategoryGroupResponse[]> {
    const rows = await this.activeCategories();

    return Object.values(CategoryGroupEnum)
      .map((group) => ({
        group,
        categories: rows
          .filter((row) => row.group === group)
          .map((row) => toResponse(row, locale)),
      }))
      // Nhóm rỗng bị loại ở đây chứ không để giao diện tự lọc, nếu không mỗi
      // chỗ hiển thị menu lại phải nhớ làm việc đó.
      .filter((entry) => entry.categories.length > 0);
  }

  async listFeatured(locale: LocaleEnum): Promise<CategoryResponse[]> {
    const rows = await this.activeCategories();

    return rows.filter((row) => row.isFeatured).map((row) => toResponse(row, locale));
  }

  /** Category mùa ứng với tháng hiện tại, để trang chủ không phải đổi tay mỗi quý. */
  async currentSeason(locale: LocaleEnum): Promise<CategoryResponse | null> {
    const rows = await this.activeCategories();
    const row = rows.find((item) => item.slug === currentSeasonSlug());

    return row ? toResponse(row, locale) : null;
  }

  async findBySlug(slug: string, locale: LocaleEnum): Promise<CategoryResponse> {
    const row = await this.repository.findBySlug(slug);

    if (!row || !row.isActive) {
      throw new NotFoundException('catalog.category_not_found');
    }

    return toResponse(row, locale);
  }

  /**
   * Danh mục đọc rất nhiều, đổi rất ít, mà mỗi truy vấn D1 là một lượt gọi
   * HTTPS — nên đi qua cache với TTL ngắn.
   */
  private activeCategories(): Promise<CategoryRow[]> {
    return this.cache.wrap(
      CATEGORY_LIST_CACHE_KEY,
      this.config.get('CATALOG_CACHE_TTL_MS', { infer: true }),
      () => this.repository.findAllActive(),
    );
  }
}

export function toResponse(row: CategoryRow, locale: LocaleEnum): CategoryResponse {
  return {
    id: row.id,
    slug: row.slug,
    name: resolveTranslated(row.name, locale),
    group: row.group,
    description: resolveTranslatedOrNull(row.description, locale),
    imageUrl: row.imageUrl,
    isFeatured: row.isFeatured,
  };
}
