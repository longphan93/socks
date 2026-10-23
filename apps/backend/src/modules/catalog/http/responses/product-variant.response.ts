import { ApiProperty } from '@nestjs/swagger';
import { VariantOptionResponse } from './variant-option.response.js';

export class ProductVariantResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty({ type: VariantOptionResponse })
  size!: VariantOptionResponse;

  @ApiProperty({ type: VariantOptionResponse })
  color!: VariantOptionResponse;

  @ApiProperty({ description: 'VND, số nguyên' })
  price!: number;

  @ApiProperty()
  stock!: number;
}
