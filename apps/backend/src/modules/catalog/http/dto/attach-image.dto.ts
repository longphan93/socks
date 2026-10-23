import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { TranslatedFieldDto } from './translated-field.dto.js';

export class AttachImageDto {
  @ApiProperty({ description: 'Khoá object nhận được từ bước xin presign' })
  @IsString()
  key!: string;

  @ApiPropertyOptional({ type: TranslatedFieldDto, description: 'Chữ thay ảnh, cho SEO' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedFieldDto)
  alt?: TranslatedFieldDto;
}
