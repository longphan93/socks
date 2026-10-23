import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VariantOptionKindEnum } from '../../../../common/enums/index.js';

/** Khác `VariantOptionResponse` ở chỗ có kind và trạng thái, dùng cho trang quản trị. */
export class VariantOptionDetailResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: VariantOptionKindEnum })
  kind!: VariantOptionKindEnum;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  hexColor!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;
}
