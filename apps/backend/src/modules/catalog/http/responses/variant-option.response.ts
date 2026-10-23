import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VariantOptionResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Dùng trong URL filter, vd "39-42"' })
  value!: string;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Chỉ có với màu' })
  hexColor?: string | null;
}
