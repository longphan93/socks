import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShippingMethodResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'VND. Với hình thức phí dao động thì đây là mức tối thiểu' })
  fee!: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Có giá trị nghĩa là phí dao động, chốt khi nhân viên gọi xác nhận',
  })
  feeMax!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  freeFrom!: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  areaNote!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  estimatedTime!: string | null;

  @ApiProperty({ description: 'Khách tự tới lấy: checkout không hỏi địa chỉ' })
  isPickup!: boolean;
}
