import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../config/env.js';

/**
 * Giới hạn số đơn một IP đặt được trong một cửa sổ thời gian.
 *
 * Throttler chung đếm mọi request nên không chặn được kiểu spam này: xem hàng
 * là hợp lệ, đặt 50 đơn ma trong một phút thì không. Chỉ đếm đơn ĐÃ tạo
 * thành công, để người gõ sai địa chỉ vài lần không bị khoá.
 */
@Injectable()
export class OrderRateLimitService {
  private readonly placed = new Map<string, { count: number; firstAt: number }>();

  constructor(private readonly config: ConfigService<Env, true>) {}

  assertCanOrder(ip: string): void {
    const entry = this.current(ip);

    if (entry && entry.count >= this.config.get('ORDER_THROTTLE_LIMIT', { infer: true })) {
      throw new HttpException('order.too_many_orders', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  record(ip: string): void {
    const entry = this.current(ip);

    if (entry) entry.count += 1;
    else this.placed.set(ip, { count: 1, firstAt: Date.now() });
  }

  private current(ip: string): { count: number; firstAt: number } | undefined {
    const entry = this.placed.get(ip);

    if (!entry) return undefined;

    if (Date.now() - entry.firstAt > this.config.get('ORDER_THROTTLE_TTL_MS', { infer: true })) {
      this.placed.delete(ip);

      return undefined;
    }

    return entry;
  }
}
