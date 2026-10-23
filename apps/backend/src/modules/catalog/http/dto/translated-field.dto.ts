import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Nội dung dịch được; tiếng Việt bắt buộc, tiếng Anh để trống thì rơi về tiếng Việt. */
export class TranslatedFieldDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  vi!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  en?: string;
}
