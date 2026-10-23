import { ApiProperty } from '@nestjs/swagger';
import { CategoryGroupEnum } from '../../../../common/enums/index.js';
import { CategoryResponse } from './category.response.js';

/** Menu header: category gom theo nhóm, nhóm rỗng đã được loại bỏ. */
export class CategoryGroupResponse {
  @ApiProperty({ enum: CategoryGroupEnum })
  group!: CategoryGroupEnum;

  @ApiProperty({ type: [CategoryResponse] })
  categories!: CategoryResponse[];
}
