import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MemoryCacheService } from '../../../common/cache/memory-cache.service.js';
import { LocaleEnum } from '../../../common/enums/index.js';
import { CATALOG_CACHE_PREFIX } from '../constants/index.js';
import { CategoryRepository } from '../repositories/category.repository.js';
import { CategoryResponse } from '../http/responses/index.js';
import { CreateCategoryDto, UpdateCategoryDto } from '../http/dto/index.js';
import { toResponse } from './category.service.js';

@Injectable()
export class AdminCategoryService {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly cache: MemoryCacheService,
  ) {}

  async list(locale: LocaleEnum): Promise<CategoryResponse[]> {
    const rows = await this.repository.findAll();

    return rows.map((row) => toResponse(row, locale));
  }

  async create(dto: CreateCategoryDto, locale: LocaleEnum): Promise<CategoryResponse> {
    if (await this.repository.findBySlug(dto.slug)) {
      throw new ConflictException('catalog.slug_taken');
    }

    const row = await this.repository.create({
      name: dto.name,
      description: dto.description,
      slug: dto.slug,
      group: dto.group,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
    });

    this.cache.invalidate(CATALOG_CACHE_PREFIX);

    return toResponse(row, locale);
  }

  async update(id: string, dto: UpdateCategoryDto, locale: LocaleEnum): Promise<CategoryResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('catalog.category_not_found');
    }

    if (dto.slug && dto.slug !== existing.slug && (await this.repository.findBySlug(dto.slug))) {
      throw new ConflictException('catalog.slug_taken');
    }

    // `update` của Drizzle bỏ qua key có giá trị undefined, nên dựng một object
    // rồi để trường client không gửi là undefined, thay vì một chuỗi if.
    const row = await this.repository.update(id, {
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      slug: dto.slug ?? undefined,
      group: dto.group ?? undefined,
      imageUrl: dto.imageUrl ?? undefined,
      sortOrder: dto.sortOrder ?? undefined,
      isActive: dto.isActive ?? undefined,
      isFeatured: dto.isFeatured ?? undefined,
    });

    this.cache.invalidate(CATALOG_CACHE_PREFIX);

    return toResponse(row, locale);
  }

  /** Xoá category chỉ gỡ liên kết, sản phẩm vẫn còn. */
  async remove(id: string): Promise<void> {
    if (!(await this.repository.findById(id))) {
      throw new NotFoundException('catalog.category_not_found');
    }

    await this.repository.deleteWithLinks(id);
    this.cache.invalidate(CATALOG_CACHE_PREFIX);
  }
}
