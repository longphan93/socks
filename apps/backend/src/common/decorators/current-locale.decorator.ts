import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { LocaleEnum } from '../enums/index.js';

/**
 * Ngôn ngữ của request, lấy từ header `Accept-Language`.
 *
 * Service nhận locale rồi mới dựng response, vì nội dung trong DB lưu JSON
 * `{vi, en}` còn client phải nhận chuỗi đã chọn ngôn ngữ.
 */
export const CurrentLocale = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const header: string = context.switchToHttp().getRequest().headers?.['accept-language'] ?? '';

  const requested = header
    .split(',')
    .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase());

  return (
    requested.find((code): code is LocaleEnum =>
      Object.values(LocaleEnum).includes(code as LocaleEnum),
    ) ?? LocaleEnum.VI
  );
});
