import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CategoryGroupEnum } from '../../../../common/enums/index.js';
import { TranslatedFieldDto } from './translated-field.dto.js';

export class CreateCategoryDto {
  @ApiProperty({ type: TranslatedFieldDto })
  @ValidateNested()
  @Type(() => TranslatedFieldDto)
  name!: TranslatedFieldDto;

  @ApiPropertyOptional({ type: TranslatedFieldDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedFieldDto)
  description?: TranslatedFieldDto;

  @ApiProperty({ example: 'winter-2026' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'catalog.invalid_slug' })
  slug!: string;

  @ApiProperty({ enum: CategoryGroupEnum })
  @IsEnum(CategoryGroupEnum)
  group!: CategoryGroupEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
