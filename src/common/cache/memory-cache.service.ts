import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache in-memory, TTL ngắn.
 *
 * Mỗi truy vấn D1 là một lượt gọi HTTPS sang Worker, nên dữ liệu catalog đọc
 * nhiều mà đổi ít (danh mục, menu, sản phẩm) nên đi qua đây. Cache nằm trong
 * tiến trình: chạy nhiều instance thì mỗi instance có bản riêng, chấp nhận
 * được vì TTL chỉ vài chục giây.
 */
@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  /** Gộp các lần gọi cùng key đang chạy để không bắn nhiều request trùng nhau. */
  private readonly inflight = new Map<string, Promise<unknown>>();

  async wrap<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    if (ttlMs <= 0) return load();

    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;

    const pending = this.inflight.get(key);
    if (pending) return pending as Promise<T>;

    const promise = load()
      .then((value) => {
        this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
        return value;
      })
      .finally(() => this.inflight.delete(key));

    this.inflight.set(key, promise);
    return promise;
  }

  /** Xoá theo tiền tố, dùng sau khi admin sửa dữ liệu catalog. */
  invalidate(prefix: string): void {
    let removed = 0;
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
        removed++;
      }
    }
    if (removed > 0) this.logger.debug(`Xoá ${removed} key cache với tiền tố "${prefix}"`);
  }

  clear(): void {
    this.entries.clear();
  }
}
