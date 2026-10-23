import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { MAX_QUANTITY_PER_LINE } from '../../constants/index.js';

export class OrderLineDto {
  @ApiProperty({ description: 'id của biến thể (size + màu cụ thể)' })
  @IsString()
  variantId!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_QUANTITY_PER_LINE })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'order.invalid_quantity' })
  @Max(MAX_QUANTITY_PER_LINE, { message: 'order.quantity_too_large' })
  quantity!: number;
}
