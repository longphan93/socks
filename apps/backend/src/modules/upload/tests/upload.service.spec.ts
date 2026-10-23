import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_BYTES } from '../constants/index.js';
import type { StorageService } from '../services/storage.service.js';
import { UploadService } from '../services/upload.service.js';

function makeService() {
  const storage = {
    presignPut: vi.fn().mockResolvedValue('https://kho.test/signed'),
    publicUrl: (key: string) => `https://cdn.test/${key}`,
  } as unknown as StorageService;

  return { service: new UploadService(storage), storage };
}

describe('UploadService.presignProductImage', () => {
  it('sinh key dạng products/<uuid>.<ext>, không lấy tên file người dùng gửi', async () => {
    const { service } = makeService();

    const result = await service.presignProductImage({
      // Tên có dấu, khoảng trắng và đường dẫn thoát thư mục.
      filename: '../../tất len đông.png',
      contentType: 'image/png',
      size: 1000,
    });

    expect(result.key).toMatch(
      /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
    expect(result.key).not.toContain('..');
    expect(result.key).not.toContain(' ');
  });

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ])('đặt đuôi đúng theo %s', async (contentType, extension) => {
    const { service } = makeService();

    const result = await service.presignProductImage({ filename: 'a', contentType, size: 10 });

    expect(result.key.endsWith(`.${extension}`)).toBe(true);
  });

  it('từ chối định dạng ngoài danh sách', async () => {
    const { service } = makeService();

    await expect(
      service.presignProductImage({ filename: 'a.svg', contentType: 'image/svg+xml', size: 10 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('từ chối file quá 5 MB', async () => {
    const { service } = makeService();

    await expect(
      service.presignProductImage({
        filename: 'a.png',
        contentType: 'image/png',
        size: MAX_IMAGE_BYTES + 1,
      }),
    ).rejects.toThrow('upload.file_too_large');
  });

  it('ký kèm đúng content type đã xin, không phải loại tự đoán', async () => {
    const { service, storage } = makeService();

    await service.presignProductImage({ filename: 'a.webp', contentType: 'image/webp', size: 10 });

    expect(storage.presignPut).toHaveBeenCalledWith(expect.any(String), 'image/webp');
  });

  it('trả cả URL công khai để lưu vào sản phẩm', async () => {
    const { service } = makeService();

    const result = await service.presignProductImage({
      filename: 'a.png',
      contentType: 'image/png',
      size: 10,
    });

    expect(result.publicUrl).toBe(`https://cdn.test/${result.key}`);
    expect(result.expiresIn).toBeGreaterThan(0);
  });
});
