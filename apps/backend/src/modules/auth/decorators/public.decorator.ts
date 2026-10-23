import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/index.js';

/**
 * Mở một route cho khách vãng lai.
 *
 * Guard là global nên mặc định mọi route đều cần token; storefront dùng
 * decorator này để đi qua.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
