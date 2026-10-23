import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartLineValidationResponse {
  @ApiProperty()
  variantId!: string;

  @ApiProperty({ description: 'Còn bán hay không' })
  available!: boolean;

  @ApiProperty({ description: 'Giá mới nhất trong kho dữ liệu' })
  unitPrice!: number;

  @ApiProperty({ description: 'Tồn hiện tại' })
  stock!: number;

  @ApiProperty({ description: 'Số lượng thực sự mua được, đã cắt theo tồn' })
  quantity!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  variantLabel!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  productSlug!: string | null;
}

export class CartValidationResponse {
  @ApiProperty({ type: [CartLineValidationResponse] })
  items!: CartLineValidationResponse[];

  @ApiProperty({ description: 'Tổng tiền hàng tính lại theo giá hiện tại' })
  subtotal!: number;

  @ApiProperty({ description: 'true khi có dòng đổi giá, hết hàng hoặc bị cắt số lượng' })
  changed!: boolean;
}
