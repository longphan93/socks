import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { LocaleEnum } from '../../../common/enums/index.js';
import type { ShippingMethodService } from '../../shipping/services/shipping-method.service.js';
import type { CartVariantRepository } from '../repositories/cart-variant.repository.js';
import type { OrderRepository } from '../repositories/order.repository.js';
import { OrderService } from '../services/order.service.js';

const variant = {
  id: 'v1',
  sku: 'SKU-1',
  price: 75_000,
  stock: 10,
  isActive: true,
  productId: 'p1',
  productSlug: 'tat-len',
  productName: { vi: 'Tất len', en: 'Wool socks' },
  productIsActive: true,
  sizeLabel: { vi: '39 – 42' },
  colorLabel: { vi: 'Nâu' },
};

const method = {
  id: 'm1',
  code: 'cod-nationwide',
  name: { vi: 'COD toàn quốc' },
  fee: 30_000,
  feeMax: null as number | null,
  freeFrom: 300_000,
  isPickup: false,
};

const CUSTOMER = {
  shippingMethodId: 'm1',
  customerName: 'Nguyễn Văn A',
  phone: '0905123456',
  province: 'Đà Nẵng',
  ward: 'Hoà Cường',
  street: '12 Lê Duẩn',
};

function makeService(overrides: Record<string, unknown> = {}) {
  const createWithStockDeduction = vi.fn().mockResolvedValue(undefined);
  const orders = { createWithStockDeduction } as unknown as OrderRepository;

  const variants = {
    findForCart: vi.fn().mockResolvedValue([variant]),
    ...overrides,
  } as unknown as CartVariantRepository;

  const shippingService = {
    requireActive: vi.fn().mockResolvedValue(method),
    calculateFee: (m: typeof method, subtotal: number) =>
      m.freeFrom !== null && subtotal >= m.freeFrom
        ? { fee: 0, isEstimate: false }
        : { fee: m.fee, isEstimate: m.feeMax !== null },
  } as unknown as ShippingMethodService;

  return {
    service: new OrderService(orders, variants, shippingService),
    createWithStockDeduction,
  };
}

describe('OrderService.create — giá luôn lấy từ kho dữ liệu', () => {
  it('bỏ qua mọi con số client gửi, tính lại từ giá trong DB', async () => {
    const { service, createWithStockDeduction } = makeService();

    const result = await service.create(
      // Client chỉ gửi variantId và quantity; không có chỗ nào gửi giá lên được.
      { ...CUSTOMER, items: [{ variantId: 'v1', quantity: 2 }] },
      LocaleEnum.VI,
    );

    expect(result.subtotal).toBe(150_000);
    expect(result.items[0].unitPrice).toBe(75_000);

    const saved = createWithStockDeduction.mock.calls[0][0];
    expect(saved.order.subtotal).toBe(150_000);
    expect(saved.items[0].unitPrice).toBe(75_000);
  });

  it('chụp lại tên và giá vào dòng đơn, không tham chiếu sống', async () => {
    const { service, createWithStockDeduction } = makeService();

    await service.create({ ...CUSTOMER, items: [{ variantId: 'v1', quantity: 1 }] }, LocaleEnum.VI);

    const item = createWithStockDeduction.mock.calls[0][0].items[0];
    expect(item.productName).toBe('Tất len');
    expect(item.variantLabel).toBe('39 – 42 · Nâu');
    expect(item.sku).toBe('SKU-1');
  });

  it('miễn phí ship khi vượt ngưỡng', async () => {
    const { service } = makeService();

    const result = await service.create(
      { ...CUSTOMER, items: [{ variantId: 'v1', quantity: 4 }] },
      LocaleEnum.VI,
    );

    expect(result.subtotal).toBe(300_000);
    expect(result.shippingFee).toBe(0);
    expect(result.total).toBe(300_000);
  });

  it('đánh dấu phí tạm tính với hình thức có khoảng phí', async () => {
    const { service } = makeService();
    method.feeMax = 50_000;

    const result = await service.create(
      { ...CUSTOMER, items: [{ variantId: 'v1', quantity: 1 }] },
      LocaleEnum.VI,
    );

    expect(result.shippingFeeIsEstimate).toBe(true);
    expect(result.shippingFeeMax).toBe(50_000);
    method.feeMax = null;
  });
});

describe('OrderService.create — hết hàng', () => {
  it('đổi lỗi CHECK của D1 thành thông báo hết hàng', async () => {
    const { service, createWithStockDeduction } = makeService();
    createWithStockDeduction.mockRejectedValue(
      new Error('D1_ERROR: CHECK constraint failed: stock: SQLITE_CONSTRAINT'),
    );

    await expect(
      service.create({ ...CUSTOMER, items: [{ variantId: 'v1', quantity: 99 }] }, LocaleEnum.VI),
    ).rejects.toThrow(ConflictException);
  });

  it('lỗi hết hàng là i18n key', async () => {
    const { service, createWithStockDeduction } = makeService();
    createWithStockDeduction.mockRejectedValue(new Error('CHECK constraint failed: stock'));

    await expect(
      service.create({ ...CUSTOMER, items: [{ variantId: 'v1', quantity: 99 }] }, LocaleEnum.VI),
    ).rejects.toThrow('order.out_of_stock');
  });

  it('sinh lại mã khi trùng rồi thử tiếp', async () => {
    const { service, createWithStockDeduction } = makeService();
    createWithStockDeduction
      .mockRejectedValueOnce(new Error('UNIQUE constraint failed: orders.code'))
      .mockResolvedValue(undefined);

    await expect(
      service.create({ ...CUSTOMER, items: [{ variantId: 'v1', quantity: 1 }] }, LocaleEnum.VI),
    ).resolves.toMatchObject({ code: expect.stringMatching(/^SK-\d{8}-[A-Z2-9]{4}$/) });
    expect(createWithStockDeduction).toHaveBeenCalledTimes(2);
  });
});

describe('OrderService.create — kiểm tra đầu vào', () => {
  it('từ chối biến thể đã ngừng bán', async () => {
    const { service } = makeService({
      findForCart: vi.fn().mockResolvedValue([{ ...variant, isActive: false }]),
    });

    await expect(
      service.create({ ...CUSTOMER, items: [{ variantId: 'v1', quantity: 1 }] }, LocaleEnum.VI),
    ).rejects.toThrow('order.variant_unavailable');
  });

  it('từ chối variantId không tồn tại', async () => {
    const { service } = makeService({ findForCart: vi.fn().mockResolvedValue([]) });

    await expect(
      service.create({ ...CUSTOMER, items: [{ variantId: 'bia', quantity: 1 }] }, LocaleEnum.VI),
    ).rejects.toThrow(BadRequestException);
  });

  it('bắt buộc địa chỉ khi giao tận nơi', async () => {
    const { service } = makeService();

    await expect(
      service.create(
        { ...CUSTOMER, province: undefined, items: [{ variantId: 'v1', quantity: 1 }] },
        LocaleEnum.VI,
      ),
    ).rejects.toThrow('order.address_required');
  });

  it('ghé nhận thì không hỏi địa chỉ và không lưu địa chỉ', async () => {
    const { createWithStockDeduction } = makeService();
    const pickup = { ...method, isPickup: true, fee: 0 };
    const shipping = {
      requireActive: vi.fn().mockResolvedValue(pickup),
      calculateFee: () => ({ fee: 0, isEstimate: false }),
    } as unknown as ShippingMethodService;

    const orders = { createWithStockDeduction } as unknown as OrderRepository;
    const variants = { findForCart: vi.fn().mockResolvedValue([variant]) } as unknown as CartVariantRepository;

    await new OrderService(orders, variants, shipping).create(
      {
        shippingMethodId: 'm1',
        customerName: 'A',
        phone: '0905123456',
        items: [{ variantId: 'v1', quantity: 1 }],
      },
      LocaleEnum.VI,
    );

    expect(createWithStockDeduction.mock.calls.at(-1)![0].order.province).toBeNull();
  });
});

describe('OrderService.validateCart', () => {
  it('cắt số lượng về đúng tồn còn lại và báo đã đổi', async () => {
    const { service } = makeService({
      findForCart: vi.fn().mockResolvedValue([{ ...variant, stock: 3 }]),
    });

    const result = await service.validateCart(
      { items: [{ variantId: 'v1', quantity: 10 }] },
      LocaleEnum.VI,
    );

    expect(result.items[0].quantity).toBe(3);
    expect(result.changed).toBe(true);
  });

  it('đánh dấu không còn bán khi hết hàng', async () => {
    const { service } = makeService({
      findForCart: vi.fn().mockResolvedValue([{ ...variant, stock: 0 }]),
    });

    const result = await service.validateCart(
      { items: [{ variantId: 'v1', quantity: 1 }] },
      LocaleEnum.VI,
    );

    expect(result.items[0].available).toBe(false);
    expect(result.subtotal).toBe(0);
  });

  it('không báo đổi khi giỏ vẫn hợp lệ', async () => {
    const { service } = makeService();

    const result = await service.validateCart(
      { items: [{ variantId: 'v1', quantity: 2 }] },
      LocaleEnum.VI,
    );

    expect(result.changed).toBe(false);
    expect(result.subtotal).toBe(150_000);
  });
});
