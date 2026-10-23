import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponse } from './category.response.js';
import { ProductImageResponse } from './product-image.response.js';
import { ProductVariantResponse } from './product-variant.response.js';

export class ProductDetailResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty()
  priceMin!: number;

  @ApiProperty()
  priceMax!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: [ProductImageResponse] })
  images!: ProductImageResponse[];

  @ApiProperty({ type: [ProductVariantResponse] })
  variants!: ProductVariantResponse[];

  @ApiProperty({ type: [CategoryResponse] })
  categories!: CategoryResponse[];
}
