import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageDetailResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  r2Key!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  alt!: string | null;

  @ApiProperty()
  sortOrder!: number;
}
