/** Chỉ nhận ba định dạng ảnh web dùng được; không nhận gif hay svg. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Phần mở rộng tương ứng, dùng dựng key. */
export const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** URL ký chỉ sống 5 phút: đủ để upload, ngắn để lộ ra ngoài cũng khó dùng lại. */
export const PRESIGN_EXPIRES_SECONDS = 5 * 60;

export const PRODUCT_IMAGE_PREFIX = 'products/';

/** Ảnh upload rồi mà không gắn vào sản phẩm nào sau mốc này thì bị dọn. */
export const ORPHAN_GRACE_HOURS = 24;
