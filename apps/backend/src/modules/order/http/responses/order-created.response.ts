import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderLineResponse {
  @ApiProperty()
  productName!: string;

  @ApiProperty()
  variantLabel!: string;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  lineTotal!: number;
}

export class OrderCreatedResponse {
  @ApiProperty({ example: 'SK-20261023-K7P2' })
  code!: string;

  @ApiProperty({ type: [OrderLineResponse] })
  items!: OrderLineResponse[];

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  shippingFee!: number;

  @ApiProperty({ description: 'subtotal - discount + shippingFee' })
  total!: number;

  @ApiProperty({
    description: 'true khi phí ship còn phụ thuộc quãng đường, nhân viên chốt lại khi gọi',
  })
  shippingFeeIsEstimate!: boolean;

  @ApiProperty()
  shippingMethodName!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, description: 'Mức trần nếu phí dao động' })
  shippingFeeMax!: number | null;
}
