import { randomInt } from 'node:crypto';
import {
  ORDER_CODE_ALPHABET,
  ORDER_CODE_LENGTH,
  ORDER_CODE_PREFIX,
} from '../constants/index.js';

/**
 * Sinh mã đơn `SK-YYYYMMDD-XXXX`.
 *
 * Bốn ký tự ngẫu nhiên chứ không phải số thứ tự trong ngày: D1 không có
 * sequence, mà đếm rồi cộng một sẽ thành điểm nghẽn khi hai người đặt cùng
 * lúc. Số chạy liên tục cũng để lộ sản lượng bán cho người ngoài.
 */
export function generateOrderCode(now: Date = new Date()): string {
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');

  let suffix = '';

  for (let index = 0; index < ORDER_CODE_LENGTH; index++) {
    suffix += ORDER_CODE_ALPHABET[randomInt(ORDER_CODE_ALPHABET.length)];
  }

  return `${ORDER_CODE_PREFIX}-${date}-${suffix}`;
}
