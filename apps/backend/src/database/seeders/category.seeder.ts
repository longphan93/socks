import { Logger } from '@nestjs/common';
import { CategoryGroupEnum } from '../../common/enums/index.js';
import { Database } from '../drizzle.provider.js';
import { insertInChunks } from '../helpers/insert-in-chunks.helper.js';
import { categories } from '../schema/index.js';

interface SeedCategory {
  slug: string;
  vi: string;
  en: string;
  group: CategoryGroupEnum;
  featured?: boolean;
}

const CATEGORIES: SeedCategory[] = [
  { slug: 'spring', vi: 'Xuân', en: 'Spring', group: CategoryGroupEnum.SEASON },
  { slug: 'summer', vi: 'Hạ', en: 'Summer', group: CategoryGroupEnum.SEASON },
  { slug: 'autumn', vi: 'Thu', en: 'Autumn', group: CategoryGroupEnum.SEASON },
  { slug: 'winter', vi: 'Đông', en: 'Winter', group: CategoryGroupEnum.SEASON, featured: true },
  { slug: 'all-season', vi: 'Bốn mùa', en: 'All season', group: CategoryGroupEnum.SEASON },

  { slug: 'ankle-socks', vi: 'Tất cổ ngắn', en: 'Ankle socks', group: CategoryGroupEnum.TYPE },
  { slug: 'crew-socks', vi: 'Tất cổ cao', en: 'Crew socks', group: CategoryGroupEnum.TYPE },
  { slug: 'wool-socks', vi: 'Tất len', en: 'Wool socks', group: CategoryGroupEnum.TYPE },
  { slug: 'cotton-socks', vi: 'Tất cotton', en: 'Cotton socks', group: CategoryGroupEnum.TYPE },
  { slug: 'tights', vi: 'Quần tất', en: 'Tights', group: CategoryGroupEnum.TYPE },

  { slug: 'men', vi: 'Nam', en: 'Men', group: CategoryGroupEnum.AUDIENCE },
  { slug: 'women', vi: 'Nữ', en: 'Women', group: CategoryGroupEnum.AUDIENCE },
  { slug: 'unisex', vi: 'Unisex', en: 'Unisex', group: CategoryGroupEnum.AUDIENCE },
  { slug: 'kids', vi: 'Trẻ em', en: 'Kids', group: CategoryGroupEnum.AUDIENCE },

  { slug: 'tet-gifts', vi: 'Quà Tết', en: 'Lunar New Year gifts', group: CategoryGroupEnum.OCCASION, featured: true },
  { slug: 'valentine', vi: 'Valentine', en: "Valentine's Day", group: CategoryGroupEnum.OCCASION },
  { slug: 'womens-day', vi: 'Quốc tế Phụ nữ 8/3', en: "International Women's Day", group: CategoryGroupEnum.OCCASION },
  { slug: 'vietnamese-womens-day', vi: 'Phụ nữ Việt Nam 20/10', en: "Vietnamese Women's Day", group: CategoryGroupEnum.OCCASION },
  { slug: 'teachers-day', vi: 'Nhà giáo Việt Nam 20/11', en: "Teachers' Day", group: CategoryGroupEnum.OCCASION },
  { slug: 'christmas', vi: 'Giáng sinh', en: 'Christmas', group: CategoryGroupEnum.OCCASION },
  { slug: 'birthday', vi: 'Sinh nhật', en: 'Birthday', group: CategoryGroupEnum.OCCASION },

  { slug: 'winter-2026', vi: 'Bộ sưu tập Đông 2026', en: 'Winter 2026 collection', group: CategoryGroupEnum.COLLECTION, featured: true },
  { slug: 'da-nang-daily', vi: 'Đà Nẵng thường ngày', en: 'Da Nang daily', group: CategoryGroupEnum.COLLECTION },
];

export async function seedCategories(db: Database): Promise<void> {
  const rows = CATEGORIES.map((category, index) => ({
    slug: category.slug,
    name: { vi: category.vi, en: category.en },
    group: category.group,
    sortOrder: index,
    isFeatured: category.featured ?? false,
  }));

  await insertInChunks(categories, rows, (chunk) =>
    db.insert(categories).values(chunk).onConflictDoNothing(),
  );

  new Logger('Seed').log(`categories: ${rows.length} dòng`);
}
