import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryGroupEnum } from '../../../../common/enums/index.js';

export class CategoryResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ description: 'Đã giải theo Accept-Language' })
  name!: string;

  @ApiProperty({ enum: CategoryGroupEnum })
  group!: CategoryGroupEnum;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl!: string | null;

  @ApiProperty()
  isFeatured!: boolean;
}
