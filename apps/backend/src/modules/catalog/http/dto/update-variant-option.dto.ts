import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVariantOptionDto } from './create-variant-option.dto.js';

/** `kind` không đổi được: đổi size thành màu sẽ làm hỏng mọi biến thể đang dùng. */
export class UpdateVariantOptionDto extends PartialType(
  OmitType(CreateVariantOptionDto, ['kind'] as const),
) {}
