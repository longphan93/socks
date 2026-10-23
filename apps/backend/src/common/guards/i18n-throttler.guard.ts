import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

/**
 * ThrottlerGuard mặc định ném câu "ThrottlerException: Too Many Requests" —
 * lọt thẳng ra client bằng tiếng Anh, không qua i18n. Guard này ném i18n key
 * để exception filter dịch như mọi lỗi khác.
 */
@Injectable()
export class I18nThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('common.too_many_requests');
  }
}
