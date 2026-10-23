import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../config/env.js';

/**
 * Khoá tạm việc đăng nhập sau nhiều lần sai, đếm theo IP.
 *
 * Không dùng throttler của Nest cho việc này: throttler đếm MỌI request nên
 * đăng nhập đúng cũng tính, và một throttler đặt tên trong cấu hình toàn cục
 * sẽ áp cho mọi route chứ không riêng route gắn decorator.
 *
 * Đếm theo IP chứ không theo email, vì đếm theo email thì bất kỳ ai cũng khoá
 * được tài khoản admin chỉ bằng cách gõ sai vài lần.
 */
@Injectable()
export class LoginAttemptService {
  private readonly failures = new Map<string, { count: number; firstAt: number }>();

  constructor(private readonly config: ConfigService<Env, true>) {}

  assertNotLocked(ip: string): void {
    const entry = this.current(ip);

    if (entry && entry.count >= this.config.get('LOGIN_THROTTLE_LIMIT', { infer: true })) {
      throw new HttpException('auth.too_many_login_attempts', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  recordFailure(ip: string): void {
    const entry = this.current(ip);

    if (entry) entry.count += 1;
    else this.failures.set(ip, { count: 1, firstAt: Date.now() });
  }

  /** Đăng nhập thành công thì xoá sổ, người dùng thật không bị phạt lây. */
  clear(ip: string): void {
    this.failures.delete(ip);
  }

  private current(ip: string): { count: number; firstAt: number } | undefined {
    const entry = this.failures.get(ip);

    if (!entry) return undefined;

    if (Date.now() - entry.firstAt > this.config.get('LOGIN_THROTTLE_TTL_MS', { infer: true })) {
      this.failures.delete(ip);

      return undefined;
    }

    return entry;
  }
}
