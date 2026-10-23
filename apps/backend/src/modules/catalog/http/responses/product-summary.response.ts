import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductImageResponse } from './product-image.response.js';
import { ProductVariantResponse } from './product-variant.response.js';

/** Dùng cho lưới sản phẩm: đủ để thẻ hiện giá và chọn size ngay trên thẻ. */
export class ProductSummaryResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Bằng priceMax khi mọi biến thể cùng giá' })
  priceMin!: number;

  @ApiProperty()
  priceMax!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiPropertyOptional({ type: ProductImageResponse, nullable: true })
  image!: ProductImageResponse | null;

  @ApiProperty({ type: [ProductVariantResponse] })
  variants!: ProductVariantResponse[];
}
