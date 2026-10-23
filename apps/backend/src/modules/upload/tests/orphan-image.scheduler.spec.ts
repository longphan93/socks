import { describe, expect, it, vi } from 'vitest';
import type { ProductImageRepository } from '../../catalog/repositories/product-image.repository.js';
import { ORPHAN_GRACE_HOURS } from '../constants/index.js';
import { OrphanImageScheduler } from '../schedulers/orphan-image.scheduler.js';
import type { StorageService } from '../services/storage.service.js';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

function makeScheduler(objects: { key: string; lastModified: Date }[], used: string[]) {
  const remove = vi.fn().mockResolvedValue(undefined);
  const storage = {
    isConfigured: true,
    list: vi.fn().mockResolvedValue(objects),
    remove,
  } as unknown as StorageService;

  const images = {
    usedKeys: vi.fn().mockResolvedValue(new Set(used)),
  } as unknown as ProductImageRepository;

  return { scheduler: new OrphanImageScheduler(storage, images), remove };
}

describe('OrphanImageScheduler.sweep', () => {
  it('xoá ảnh cũ không gắn với sản phẩm nào', async () => {
    const { scheduler, remove } = makeScheduler(
      [{ key: 'products/mo-coi.png', lastModified: hoursAgo(ORPHAN_GRACE_HOURS + 1) }],
      [],
    );

    await expect(scheduler.sweep()).resolves.toBe(1);
    expect(remove).toHaveBeenCalledWith('products/mo-coi.png');
  });

  it('giữ ảnh đang được sản phẩm dùng, dù đã cũ', async () => {
    const { scheduler, remove } = makeScheduler(
      [{ key: 'products/dang-dung.png', lastModified: hoursAgo(ORPHAN_GRACE_HOURS + 100) }],
      ['products/dang-dung.png'],
    );

    await expect(scheduler.sweep()).resolves.toBe(0);
    expect(remove).not.toHaveBeenCalled();
  });

  it('giữ ảnh vừa upload — admin có thể đang điền form dở', async () => {
    const { scheduler, remove } = makeScheduler(
      [{ key: 'products/vua-upload.png', lastModified: hoursAgo(1) }],
      [],
    );

    await expect(scheduler.sweep()).resolves.toBe(0);
    expect(remove).not.toHaveBeenCalled();
  });

  it('một file xoá lỗi không chặn các file còn lại', async () => {
    const { scheduler, remove } = makeScheduler(
      [
        { key: 'products/a.png', lastModified: hoursAgo(48) },
        { key: 'products/b.png', lastModified: hoursAgo(48) },
      ],
      [],
    );
    vi.mocked(remove).mockRejectedValueOnce(new Error('mạng lỗi'));

    await expect(scheduler.sweep()).resolves.toBe(2);
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it('không làm gì khi chưa cấu hình kho lưu trữ', async () => {
    const storage = { isConfigured: false } as unknown as StorageService;
    const images = { usedKeys: vi.fn() } as unknown as ProductImageRepository;

    await expect(new OrphanImageScheduler(storage, images).sweep()).resolves.toBe(0);
    expect(images.usedKeys).not.toHaveBeenCalled();
  });
});
