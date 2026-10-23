import { BadRequestException, ValidationError } from '@nestjs/common';

/**
 * Gom lỗi validate thành danh sách i18n key thuần.
 *
 * Mặc định class-validator trả lỗi lồng theo cây và Nest nối đường dẫn vào
 * trước thông điệp (`items.0.order.quantity_too_large`), nên key không còn
 * khớp bảng dịch và client nhận chuỗi thô. Lấy riêng phần constraint ở mọi
 * tầng để exception filter dịch được.
 */
export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({ message: collect(errors) });
}

function collect(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    messages.push(...Object.values(error.constraints ?? {}));

    if (error.children?.length) {
      messages.push(...collect(error.children));
    }
  }

  // Cùng một lỗi trên nhiều dòng hàng chỉ cần hiện một lần.
  return [...new Set(messages)];
}
