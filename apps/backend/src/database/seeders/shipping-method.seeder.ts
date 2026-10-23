import { Logger } from '@nestjs/common';
import { Database } from '../drizzle.provider.js';
import { insertInChunks } from '../helpers/insert-in-chunks.helper.js';
import { shippingMethods } from '../schema/index.js';

/** Miễn phí giao từ mức này, áp cho mọi hình thức. */
const FREE_FROM = 300_000;

export async function seedShippingMethods(db: Database): Promise<void> {
  const rows = [
    {
      code: 'pickup',
      name: { vi: 'Ghé nhận tại shop', en: 'Pick up in person' },
      description: {
        vi: 'Hẹn giờ qua Zalo rồi ghé lấy, không mất phí giao.',
        en: 'Arrange a time on Zalo and collect your order. No delivery fee.',
      },
      fee: 0,
      freeFrom: null,
      estimatedTime: { vi: 'Theo giờ hẹn', en: 'By appointment' },
      isPickup: true,
      sortOrder: 0,
    },
    {
      code: 'express-danang',
      name: { vi: 'Hoả tốc nội thành Đà Nẵng', en: 'Express — inner-city Da Nang' },
      description: {
        vi: 'Giao trong vài giờ. Phí thay đổi theo quãng đường, nhân viên báo chính xác khi gọi xác nhận.',
        en: 'Delivered within hours. The fee depends on distance and is confirmed on the phone.',
      },
      // Phí dao động: giao diện hiện khoảng 20.000 – 50.000 ₫.
      fee: 20_000,
      feeMax: 50_000,
      freeFrom: FREE_FROM,
      areaNote: {
        vi: 'Chỉ nội thành Đà Nẵng, bán kính khoảng 15 km',
        en: 'Inner-city Da Nang only, within about 15 km',
      },
      estimatedTime: { vi: 'Trong vài giờ', en: 'Within a few hours' },
      sortOrder: 1,
    },
    {
      code: 'sameday-danang',
      name: { vi: 'Giao trong ngày — Đà Nẵng', en: 'Same-day delivery — Da Nang' },
      fee: 20_000,
      freeFrom: FREE_FROM,
      areaNote: { vi: 'Nội thành Đà Nẵng', en: 'Inner-city Da Nang' },
      estimatedTime: { vi: 'Trong ngày', en: 'Same day' },
      sortOrder: 2,
    },
    {
      code: 'cod-nationwide',
      name: { vi: 'COD toàn quốc', en: 'Cash on delivery — nationwide' },
      description: {
        vi: 'Gửi qua GHTK hoặc GHN, thanh toán khi nhận hàng.',
        en: 'Shipped via GHTK or GHN, paid on delivery.',
      },
      fee: 30_000,
      freeFrom: FREE_FROM,
      estimatedTime: { vi: '2 – 5 ngày', en: '2 – 5 days' },
      sortOrder: 3,
    },
  ];

  await insertInChunks(shippingMethods, rows, (chunk) =>
    db.insert(shippingMethods).values(chunk).onConflictDoNothing(),
  );

  new Logger('Seed').log(`shipping_methods: ${rows.length} dòng`);
}
