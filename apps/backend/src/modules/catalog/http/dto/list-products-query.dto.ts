import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto.js';
import { ProductSortEnum } from '../../enums/index.js';

/** Nhận cả `?size=a&size=b` lẫn `?size=a,b`. */
const toArray = () =>
  Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;

    return (Array.isArray(value) ? value : String(value).split(','))
      .map((item: string) => item.trim())
      .filter(Boolean);
  });

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Slug category; nhiều slug nghĩa là sản phẩm phải thuộc TẤT CẢ',
    isArray: true,
  })
  @IsOptional()
  @toArray()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({ description: 'Tìm theo tên sản phẩm' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  search?: string;

  @ApiPropertyOptional({ description: 'VND' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'VND' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Giá trị size, nhiều size là phép HỢP', isArray: true })
  @IsOptional()
  @toArray()
  @IsArray()
  @IsString({ each: true })
  size?: string[];

  @ApiPropertyOptional({ description: 'Giá trị màu, nhiều màu là phép HỢP', isArray: true })
  @IsOptional()
  @toArray()
  @IsArray()
  @IsString({ each: true })
  color?: string[];

  @ApiPropertyOptional({ enum: ProductSortEnum, default: ProductSortEnum.NEWEST })
  @IsOptional()
  @IsEnum(ProductSortEnum)
  sort: ProductSortEnum = ProductSortEnum.NEWEST;
}
