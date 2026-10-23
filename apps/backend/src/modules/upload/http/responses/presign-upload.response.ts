import { ApiProperty } from '@nestjs/swagger';

export class PresignUploadResponse {
  @ApiProperty({ description: 'PUT thẳng file lên đây, kèm đúng header Content-Type' })
  uploadUrl!: string;

  @ApiProperty({ description: 'Khoá object, gửi lại khi gắn ảnh vào sản phẩm' })
  key!: string;

  @ApiProperty({ description: 'URL công khai để hiển thị ảnh' })
  publicUrl!: string;

  @ApiProperty({ description: 'Số giây URL còn hiệu lực' })
  expiresIn!: number;
}
