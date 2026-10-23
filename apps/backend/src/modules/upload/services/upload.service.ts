import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EXTENSION_BY_TYPE,
  MAX_IMAGE_BYTES,
  PRESIGN_EXPIRES_SECONDS,
  PRODUCT_IMAGE_PREFIX,
} from '../constants/index.js';
import { PresignUploadDto } from '../http/dto/index.js';
import { PresignUploadResponse } from '../http/responses/index.js';
import { StorageService } from './storage.service.js';

@Injectable()
export class UploadService {
  constructor(private readonly storage: StorageService) {}

  async presignProductImage(dto: PresignUploadDto): Promise<PresignUploadResponse> {
    const extension = EXTENSION_BY_TYPE[dto.contentType];

    if (!extension) {
      throw new BadRequestException('upload.unsupported_type');
    }

    if (dto.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('upload.file_too_large');
    }

    // Tên do uuid sinh, không lấy từ filename người dùng gửi: tên gốc có thể
    // chứa dấu, khoảng trắng, hoặc ../ để thoát ra ngoài thư mục.
    const key = `${PRODUCT_IMAGE_PREFIX}${randomUUID()}.${extension}`;

    return {
      uploadUrl: await this.storage.presignPut(key, dto.contentType),
      key,
      publicUrl: this.storage.publicUrl(key),
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    };
  }
}
