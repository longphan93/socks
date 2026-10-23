import { LocaleEnum } from '../enums/index.js';

/**
 * Nội dung dịch được, lưu thành cột JSON.
 *
 * Tiếng Việt bắt buộc; thiếu tiếng Anh thì hiển thị rơi về tiếng Việt.
 */
export type TranslatedType = {
  [LocaleEnum.VI]: string;
  [LocaleEnum.EN]?: string;
};
