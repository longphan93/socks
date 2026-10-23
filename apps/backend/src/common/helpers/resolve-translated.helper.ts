import { LocaleEnum } from '../enums/index.js';
import { TranslatedType } from '../types/index.js';

/**
 * Chọn bản dịch theo ngôn ngữ, thiếu thì rơi về tiếng Việt.
 *
 * Trả chuỗi rỗng thay vì null khi không có gì, để giao diện không phải kiểm
 * tra null ở mọi chỗ hiển thị tên.
 */
export function resolveTranslated(
  value: TranslatedType | null | undefined,
  locale: LocaleEnum,
): string {
  if (!value) return '';

  return value[locale] || value[LocaleEnum.VI] || '';
}

/** Như trên nhưng giữ null, dùng cho mô tả và các trường có thể bỏ trống. */
export function resolveTranslatedOrNull(
  value: TranslatedType | null | undefined,
  locale: LocaleEnum,
): string | null {
  return resolveTranslated(value, locale) || null;
}
