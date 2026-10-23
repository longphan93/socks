import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductVariantDto {
  @ApiPropertyOptional({ description: 'Có id là sửa biến thể cũ, không có là thêm mới' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'id của variant_options nhóm SIZE' })
  @IsString()
  sizeId!: string;

  @ApiProperty({ description: 'id của variant_options nhóm COLOR' })
  @IsString()
  colorId!: string;

  @ApiPropertyOptional({ description: 'Bỏ trống thì tự sinh từ slug + size + màu' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ description: 'VND, số nguyên' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
