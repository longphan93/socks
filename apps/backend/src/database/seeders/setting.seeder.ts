import { Logger } from '@nestjs/common';
import { Database } from '../drizzle.provider.js';
import { insertInChunks } from '../helpers/insert-in-chunks.helper.js';
import { settings } from '../schema/index.js';

/** Giá trị khởi điểm; admin sửa trong trang quản trị, không cần deploy. */
const DEFAULTS: Record<string, string> = {
  'shop.name': 'Tất Vớ - Quà Tặng Đà Nẵng',
  'contact.zalo': '',
  'contact.phone': '',
  'contact.facebook': 'https://www.facebook.com/tatvoquatangdanang',
  'contact.instagram': '',
};

export async function seedSettings(db: Database): Promise<void> {
  const rows = Object.entries(DEFAULTS).map(([key, value]) => ({ key, value }));

  await insertInChunks(settings, rows, (chunk) =>
    db.insert(settings).values(chunk).onConflictDoNothing(),
  );

  new Logger('Seed').log(`settings: ${rows.length} dòng`);
}
