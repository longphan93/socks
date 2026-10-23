import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  alt!: string | null;
}
