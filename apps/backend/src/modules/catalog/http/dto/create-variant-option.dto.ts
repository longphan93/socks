import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { VariantOptionKindEnum } from '../../../../common/enums/index.js';
import { TranslatedFieldDto } from './translated-field.dto.js';

export class CreateVariantOptionDto {
  @ApiProperty({ enum: VariantOptionKindEnum })
  @IsEnum(VariantOptionKindEnum)
  kind!: VariantOptionKindEnum;

  @ApiProperty({ description: 'Dùng trong URL filter', example: '39-42' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'catalog.invalid_option_value' })
  value!: string;

  @ApiProperty({ type: TranslatedFieldDto })
  @ValidateNested()
  @Type(() => TranslatedFieldDto)
  label!: TranslatedFieldDto;

  @ApiPropertyOptional({ example: '#1a1a1a', description: 'Chỉ dùng cho màu' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'catalog.invalid_hex_color' })
  hexColor?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
