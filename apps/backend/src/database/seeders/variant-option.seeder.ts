import { Logger } from '@nestjs/common';
import { VariantOptionKindEnum } from '../../common/enums/index.js';
import { Database } from '../drizzle.provider.js';
import { insertInChunks } from '../helpers/insert-in-chunks.helper.js';
import { variantOptions } from '../schema/index.js';

const SIZES = [
  { value: 'free', vi: 'Free size', en: 'Free size' },
  { value: '35-38', vi: '35 – 38', en: '35 – 38' },
  { value: '39-42', vi: '39 – 42', en: '39 – 42' },
  { value: '43-46', vi: '43 – 46', en: '43 – 46' },
  { value: 's-m', vi: 'S/M', en: 'S/M' },
  { value: 'l-xl', vi: 'L/XL', en: 'L/XL' },
];

const COLORS = [
  { value: 'den', vi: 'Đen', en: 'Black', hex: '#1a1a1a' },
  { value: 'trang', vi: 'Trắng', en: 'White', hex: '#f5f5f0' },
  { value: 'xam', vi: 'Xám', en: 'Grey', hex: '#8b8b86' },
  { value: 'be', vi: 'Be', en: 'Beige', hex: '#d9c7ad' },
  { value: 'navy', vi: 'Xanh navy', en: 'Navy', hex: '#24324f' },
  { value: 'nau', vi: 'Nâu', en: 'Brown', hex: '#6b4a32' },
  { value: 'hong', vi: 'Hồng', en: 'Pink', hex: '#e2a9b4' },
  { value: 'do', vi: 'Đỏ', en: 'Red', hex: '#b5342f' },
  { value: 'xanh-reu', vi: 'Xanh rêu', en: 'Olive', hex: '#5a6245' },
];

export async function seedVariantOptions(db: Database): Promise<void> {
  const rows = [
    ...SIZES.map((size, index) => ({
      kind: VariantOptionKindEnum.SIZE,
      value: size.value,
      label: { vi: size.vi, en: size.en },
      sortOrder: index,
    })),
    ...COLORS.map((color, index) => ({
      kind: VariantOptionKindEnum.COLOR,
      value: color.value,
      label: { vi: color.vi, en: color.en },
      hexColor: color.hex,
      sortOrder: index,
    })),
  ];

  await insertInChunks(variantOptions, rows, (chunk) =>
    db.insert(variantOptions).values(chunk).onConflictDoNothing(),
  );

  new Logger('Seed').log(`variant_options: ${rows.length} dòng`);
}
