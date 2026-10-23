'use client';

import { adminFetch } from './client';

/** Phải khớp danh sách backend nhận, kiểm trước để khỏi gọi API vô ích. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface PresignResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

/** Lỗi kiểm tại chỗ, trả câu tiếng Việt luôn vì backend chưa được gọi. */
export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" không phải ảnh JPEG, PNG hay WebP`;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" nặng ${formatMb(file.size)}, vượt mức 5 MB`;
  }

  if (file.size === 0) {
    return `"${file.name}" là file rỗng`;
  }

  return null;
}

/**
 * Đưa file thẳng từ trình duyệt lên kho.
 *
 * Dùng XMLHttpRequest chứ không phải fetch vì chỉ XHR báo được tiến trình
 * upload; fetch không có sự kiện nào cho phần gửi lên.
 */
export function putToStorage(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open('PUT', url);
    // Phải đúng loại đã xin, vì chữ ký có ràng buộc Content-Type.
    request.setRequestHeader('Content-Type', file.type);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Kho lưu trữ từ chối (HTTP ${request.status})`));

    request.onerror = () => reject(new Error('Mất kết nối khi đang tải ảnh lên'));
    request.onabort = () => reject(new Error('Đã huỷ tải ảnh'));

    request.send(file);
  });
}

export function presignImage(file: File): Promise<PresignResult> {
  return adminFetch<PresignResult>('/admin/uploads/presign', {
    method: 'POST',
    body: { filename: file.name, contentType: file.type, size: file.size },
  });
}

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
