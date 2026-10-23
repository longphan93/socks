import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../../constants/index.js';

export class PresignUploadDto {
  @ApiProperty({ example: 'tat-len-dong.jpg' })
  @IsString()
  filename!: string;

  @ApiProperty({ enum: ALLOWED_IMAGE_TYPES })
  @IsIn([...ALLOWED_IMAGE_TYPES], { message: 'upload.unsupported_type' })
  contentType!: string;

  @ApiProperty({ description: 'Số byte', maximum: MAX_IMAGE_BYTES })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'upload.empty_file' })
  @Max(MAX_IMAGE_BYTES, { message: 'upload.file_too_large' })
  size!: number;
}
