import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryCacheService } from './memory-cache.service.js';

describe('MemoryCacheService', () => {
  let cache: MemoryCacheService;

  beforeEach(() => {
    cache = new MemoryCacheService();
    vi.useRealTimers();
  });

  it('chỉ gọi hàm load một lần trong thời gian TTL', async () => {
    const load = vi.fn().mockResolvedValue('danh muc');

    expect(await cache.wrap('categories', 1000, load)).toBe('danh muc');
    expect(await cache.wrap('categories', 1000, load)).toBe('danh muc');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('gộp các lần gọi song song cùng key thành một request', async () => {
    const load = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('x'), 10)),
      );

    await Promise.all([
      cache.wrap('k', 1000, load),
      cache.wrap('k', 1000, load),
      cache.wrap('k', 1000, load),
    ]);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('gọi lại sau khi hết TTL', async () => {
    const load = vi.fn().mockResolvedValue('x');

    await cache.wrap('k', 1, load);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await cache.wrap('k', 1, load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('bỏ qua cache khi TTL bằng 0', async () => {
    const load = vi.fn().mockResolvedValue('x');

    await cache.wrap('k', 0, load);
    await cache.wrap('k', 0, load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('invalidate xoá đúng các key theo tiền tố', async () => {
    const load = vi.fn().mockResolvedValue('x');
    await cache.wrap('catalog:categories', 1000, load);
    await cache.wrap('other:thing', 1000, load);

    cache.invalidate('catalog:');

    await cache.wrap('catalog:categories', 1000, load);
    await cache.wrap('other:thing', 1000, load);

    expect(load).toHaveBeenCalledTimes(3);
  });

  it('không giữ lại lỗi trong cache', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('lỗi mạng'))
      .mockResolvedValue('x');

    await expect(cache.wrap('k', 1000, load)).rejects.toThrow('lỗi mạng');
    expect(await cache.wrap('k', 1000, load)).toBe('x');
  });
});
