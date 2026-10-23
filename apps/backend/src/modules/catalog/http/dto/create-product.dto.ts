import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ProductVariantDto } from './product-variant.dto.js';
import { TranslatedFieldDto } from './translated-field.dto.js';

export class CreateProductDto {
  @ApiProperty({ type: TranslatedFieldDto })
  @ValidateNested()
  @Type(() => TranslatedFieldDto)
  name!: TranslatedFieldDto;

  @ApiPropertyOptional({ type: TranslatedFieldDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedFieldDto)
  description?: TranslatedFieldDto;

  @ApiProperty({ example: 'tat-len-mua-dong' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'catalog.invalid_slug' })
  slug!: string;

  @ApiProperty({ type: [String], description: 'id các category, một sản phẩm thuộc nhiều nhóm' })
  @IsArray()
  @IsString({ each: true })
  categoryIds!: string[];

  @ApiProperty({ type: [ProductVariantDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'catalog.product_needs_variant' })
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
