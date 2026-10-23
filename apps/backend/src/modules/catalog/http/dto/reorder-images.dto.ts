import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderImagesDto {
  @ApiProperty({ type: [String], description: 'id các ảnh theo thứ tự mong muốn' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];
}
