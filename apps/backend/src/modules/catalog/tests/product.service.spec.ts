import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { LocaleEnum } from '../../../common/enums/index.js';
import { ProductSortEnum } from '../enums/index.js';
import type { ProductRepository } from '../repositories/product.repository.js';
import { ProductService } from '../services/product.service.js';

const product = {
  id: 'p1',
  slug: 'tat-len-mua-dong',
  name: { vi: 'Tất len mùa đông', en: 'Winter wool socks' },
  description: { vi: 'Dày và ấm', en: 'Thick and warm' },
  priceMin: 75_000,
  priceMax: 89_000,
  isActive: true,
  isFeatured: true,
  createdAt: '2026-10-01 00:00:00',
};

const variant = {
  id: 'v1',
  productId: 'p1',
  sku: 'SKU-1',
  price: 75_000,
  stock: 10,
  sizeId: 's1',
  sizeValue: '39-42',
  sizeLabel: { vi: '39 – 42', en: '39 – 42' },
  colorId: 'c1',
  colorValue: 'nau',
  colorLabel: { vi: 'Nâu', en: 'Brown' },
  colorHex: '#6b4a32',
};

const image = { id: 'i1', productId: 'p1', url: 'https://cdn.test/a.jpg', alt: { vi: 'Ảnh', en: 'Photo' } };

function makeService(overrides: Partial<Record<string, unknown>> = {}) {
  const repository = {
    list: vi.fn().mockResolvedValue({ items: [product], total: 1, page: 1, limit: 24 }),
    findBySlug: vi.fn().mockResolvedValue(product),
    variantsOf: vi.fn().mockResolvedValue([variant]),
    imagesOf: vi.fn().mockResolvedValue([image]),
    categoriesOf: vi.fn().mockResolvedValue([
      { productId: 'p1', id: 'cat1', slug: 'winter', name: { vi: 'Đông', en: 'Winter' }, group: 'SEASON' },
    ]),
    ...overrides,
  } as unknown as ProductRepository;

  return { service: new ProductService(repository), repository };
}

const baseFilter = { sort: ProductSortEnum.NEWEST, page: 1, limit: 24 };

describe('ProductService.list', () => {
  it('chuyển tiếp nguyên vẹn bộ lọc nhiều category xuống repository', async () => {
    const { service, repository } = makeService();

    await service.list({ ...baseFilter, categorySlugs: ['winter', 'men'] }, LocaleEnum.VI);

    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ categorySlugs: ['winter', 'men'] }),
    );
  });

  it('đọc biến thể và ảnh một lần cho cả trang, không phải mỗi sản phẩm một lượt', async () => {
    const twoProducts = {
      list: vi.fn().mockResolvedValue({
        items: [product, { ...product, id: 'p2', slug: 'khac' }],
        total: 2,
        page: 1,
        limit: 24,
      }),
    };
    const { service, repository } = makeService(twoProducts);

    await service.list(baseFilter, LocaleEnum.VI);

    expect(repository.variantsOf).toHaveBeenCalledTimes(1);
    expect(repository.variantsOf).toHaveBeenCalledWith(['p1', 'p2']);
    expect(repository.imagesOf).toHaveBeenCalledTimes(1);
  });

  it('trả tên theo ngôn ngữ yêu cầu', async () => {
    const { service } = makeService();

    const vi = await service.list(baseFilter, LocaleEnum.VI);
    const en = await service.list(baseFilter, LocaleEnum.EN);

    expect(vi.items[0].name).toBe('Tất len mùa đông');
    expect(en.items[0].name).toBe('Winter wool socks');
  });

  it('rơi về tiếng Việt khi thiếu bản dịch tiếng Anh', async () => {
    const { service } = makeService({
      list: vi.fn().mockResolvedValue({
        items: [{ ...product, name: { vi: 'Chỉ có tiếng Việt' } }],
        total: 1,
        page: 1,
        limit: 24,
      }),
    });

    const result = await service.list(baseFilter, LocaleEnum.EN);

    expect(result.items[0].name).toBe('Chỉ có tiếng Việt');
  });

  it('client nhận chuỗi, không nhận object { vi, en }', async () => {
    const { service } = makeService();

    const result = await service.list(baseFilter, LocaleEnum.VI);

    expect(typeof result.items[0].name).toBe('string');
    expect(typeof result.items[0].variants[0].color.label).toBe('string');
  });

  it('gắn đúng ảnh và biến thể cho từng sản phẩm', async () => {
    const { service } = makeService({
      list: vi.fn().mockResolvedValue({
        items: [product, { ...product, id: 'p2', slug: 'khac' }],
        total: 2,
        page: 1,
        limit: 24,
      }),
      variantsOf: vi.fn().mockResolvedValue([variant, { ...variant, id: 'v2', productId: 'p2' }]),
      imagesOf: vi.fn().mockResolvedValue([image]),
    });

    const result = await service.list(baseFilter, LocaleEnum.VI);

    expect(result.items[0].variants.map((v) => v.id)).toEqual(['v1']);
    expect(result.items[1].variants.map((v) => v.id)).toEqual(['v2']);
    // Sản phẩm thứ hai chưa có ảnh: phải là null chứ không mượn ảnh của cái đầu.
    expect(result.items[1].image).toBeNull();
  });

  it('giữ nguyên số liệu phân trang của repository', async () => {
    const { service } = makeService({
      list: vi.fn().mockResolvedValue({ items: [], total: 57, page: 3, limit: 12 }),
    });

    const result = await service.list({ ...baseFilter, page: 3, limit: 12 }, LocaleEnum.VI);

    expect(result).toMatchObject({ total: 57, page: 3, limit: 12 });
  });
});

describe('ProductService.findBySlug', () => {
  it('báo không tìm thấy khi sản phẩm đã tắt', async () => {
    const { service } = makeService({
      findBySlug: vi.fn().mockResolvedValue({ ...product, isActive: false }),
    });

    await expect(service.findBySlug('tat-len-mua-dong', LocaleEnum.VI)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lỗi là i18n key', async () => {
    const { service } = makeService({ findBySlug: vi.fn().mockResolvedValue(undefined) });

    await expect(service.findBySlug('khong-co', LocaleEnum.VI)).rejects.toThrow(
      'catalog.product_not_found',
    );
  });
});
