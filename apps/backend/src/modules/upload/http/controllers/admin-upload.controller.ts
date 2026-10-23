import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadService } from '../../services/upload.service.js';
import { PresignUploadDto } from '../dto/index.js';
import { PresignUploadResponse } from '../responses/index.js';

@ApiBearerAuth()
@ApiTags('Admin - Uploads')
@Controller('admin/uploads')
export class AdminUploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xin URL để trình duyệt PUT ảnh thẳng lên kho — backend không nhận file',
  })
  presign(@Body() dto: PresignUploadDto): Promise<PresignUploadResponse> {
    return this.uploadService.presignProductImage(dto);
  }
}
