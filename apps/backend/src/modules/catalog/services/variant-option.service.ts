import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LocaleEnum, VariantOptionKindEnum } from '../../../common/enums/index.js';
import { resolveTranslated } from '../../../common/helpers/resolve-translated.helper.js';
import { variantOptions } from '../../../database/schema/index.js';
import { VariantOptionRepository } from '../repositories/variant-option.repository.js';
import { CreateVariantOptionDto, UpdateVariantOptionDto } from '../http/dto/index.js';
import { VariantOptionDetailResponse } from '../http/responses/index.js';

type OptionRow = typeof variantOptions.$inferSelect;

@Injectable()
export class VariantOptionService {
  constructor(private readonly repository: VariantOptionRepository) {}

  async list(locale: LocaleEnum, onlyActive = false): Promise<VariantOptionDetailResponse[]> {
    const rows = await this.repository.findAll(onlyActive);

    return rows.map((row) => toResponse(row, locale));
  }

  async create(
    dto: CreateVariantOptionDto,
    locale: LocaleEnum,
  ): Promise<VariantOptionDetailResponse> {
    if (await this.repository.findByKindAndValue(dto.kind, dto.value)) {
      throw new ConflictException('catalog.option_value_taken');
    }

    this.assertHexMatchesKind(dto.kind, dto.hexColor);

    const row = await this.repository.create({
      kind: dto.kind,
      value: dto.value,
      label: dto.label,
      hexColor: dto.hexColor,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return toResponse(row, locale);
  }

  async update(
    id: string,
    dto: UpdateVariantOptionDto,
    locale: LocaleEnum,
  ): Promise<VariantOptionDetailResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('catalog.option_not_found');
    }

    if (
      dto.value &&
      dto.value !== existing.value &&
      (await this.repository.findByKindAndValue(existing.kind, dto.value))
    ) {
      throw new ConflictException('catalog.option_value_taken');
    }

    this.assertHexMatchesKind(existing.kind, dto.hexColor);

    const row = await this.repository.update(id, {
      value: dto.value ?? undefined,
      label: dto.label ?? undefined,
      hexColor: dto.hexColor ?? undefined,
      sortOrder: dto.sortOrder ?? undefined,
      isActive: dto.isActive ?? undefined,
    });

    return toResponse(row, locale);
  }

  /**
   * Ẩn thay vì xoá khi tuỳ chọn còn biến thể đang dùng.
   *
   * Xoá sẽ làm biến thể mất tham chiếu size hoặc màu, và trang sản phẩm không
   * còn hiển thị được là đôi tất đó size nào.
   */
  async deactivate(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('catalog.option_not_found');
    }

    await this.repository.update(id, { isActive: false });
  }

  private assertHexMatchesKind(kind: VariantOptionKindEnum, hexColor?: string): void {
    if (hexColor && kind !== VariantOptionKindEnum.COLOR) {
      throw new BadRequestException('catalog.hex_color_only_for_color');
    }
  }
}

function toResponse(row: OptionRow, locale: LocaleEnum): VariantOptionDetailResponse {
  return {
    id: row.id,
    kind: row.kind,
    value: row.value,
    label: resolveTranslated(row.label, locale),
    hexColor: row.hexColor,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}
