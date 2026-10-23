import { Logger } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { VariantOptionKindEnum } from '../../common/enums/index.js';
import { Database } from '../drizzle.provider.js';
import { insertInChunks } from '../helpers/insert-in-chunks.helper.js';
import {
  categories,
  productCategories,
  productVariants,
  products,
  variantOptions,
} from '../schema/index.js';

interface SeedProduct {
  slug: string;
  vi: string;
  en: string;
  price: number;
  sizes: string[];
  colors: string[];
  categories: string[];
}

/**
 * Sản phẩm mẫu để xem giao diện trước khi admin nhập hàng thật.
 *
 * Chỉ chạy khi `SEED_DEMO=true` — production không nên có sản phẩm bịa.
 */
const DEMO: SeedProduct[] = [
  { slug: 'co-ngan-tron-co-ban', vi: 'Tất cổ ngắn trơn cơ bản', en: 'Plain ankle socks', price: 25_000, sizes: ['35-38', '39-42'], colors: ['den', 'trang', 'xam'], categories: ['ankle-socks', 'cotton-socks', 'unisex', 'all-season'] },
  { slug: 'co-ngan-ke-soc', vi: 'Tất cổ ngắn kẻ sọc', en: 'Striped ankle socks', price: 30_000, sizes: ['35-38', '39-42'], colors: ['navy', 'xam'], categories: ['ankle-socks', 'cotton-socks', 'unisex'] },
  { slug: 'co-cao-cotton-tron', vi: 'Tất cổ cao cotton trơn', en: 'Plain cotton crew socks', price: 35_000, sizes: ['35-38', '39-42', '43-46'], colors: ['den', 'trang', 'be'], categories: ['crew-socks', 'cotton-socks', 'unisex', 'all-season'] },
  { slug: 'co-cao-cham-bi', vi: 'Tất cổ cao chấm bi', en: 'Polka dot crew socks', price: 39_000, sizes: ['35-38', '39-42'], colors: ['hong', 'navy'], categories: ['crew-socks', 'women', 'birthday'] },
  { slug: 'len-mua-dong-day', vi: 'Tất len mùa đông dày', en: 'Thick winter wool socks', price: 75_000, sizes: ['35-38', '39-42', '43-46'], colors: ['nau', 'xam', 'xanh-reu'], categories: ['wool-socks', 'winter', 'unisex', 'winter-2026'] },
  { slug: 'len-hoa-tiet-tuan-loc', vi: 'Tất len hoạ tiết tuần lộc', en: 'Reindeer wool socks', price: 89_000, sizes: ['35-38', '39-42'], colors: ['do', 'xanh-reu'], categories: ['wool-socks', 'winter', 'christmas', 'winter-2026'] },
  { slug: 'len-mem-merino', vi: 'Tất len mềm Merino', en: 'Soft merino socks', price: 120_000, sizes: ['35-38', '39-42', '43-46'], colors: ['be', 'xam', 'navy'], categories: ['wool-socks', 'winter', 'unisex', 'winter-2026'] },
  { slug: 'quan-tat-mong-20d', vi: 'Quần tất mỏng 20D', en: '20D sheer tights', price: 95_000, sizes: ['s-m', 'l-xl'], colors: ['den', 'be'], categories: ['tights', 'women', 'all-season'] },
  { slug: 'quan-tat-giu-nhiet', vi: 'Quần tất giữ nhiệt', en: 'Thermal tights', price: 185_000, sizes: ['s-m', 'l-xl'], colors: ['den', 'nau'], categories: ['tights', 'women', 'winter'] },
  { slug: 'quan-tat-cao-cap-nhung', vi: 'Quần tất nhung cao cấp', en: 'Premium velvet tights', price: 290_000, sizes: ['s-m', 'l-xl'], colors: ['den'], categories: ['tights', 'women', 'winter', 'winter-2026'] },
  { slug: 'tre-em-hoa-tiet-thu', vi: 'Tất trẻ em hoạ tiết thú', en: 'Animal pattern kids socks', price: 28_000, sizes: ['free'], colors: ['hong', 'navy', 'trang'], categories: ['kids', 'cotton-socks', 'birthday'] },
  { slug: 'tre-em-ke-caro', vi: 'Tất trẻ em kẻ caro', en: 'Checked kids socks', price: 30_000, sizes: ['free'], colors: ['do', 'xam'], categories: ['kids', 'cotton-socks'] },
  { slug: 'nam-cong-so-tron', vi: 'Tất nam công sở trơn', en: 'Plain dress socks', price: 45_000, sizes: ['39-42', '43-46'], colors: ['den', 'navy', 'xam'], categories: ['crew-socks', 'men', 'all-season'] },
  { slug: 'nam-the-thao-co-ngan', vi: 'Tất nam thể thao cổ ngắn', en: 'Sports ankle socks', price: 32_000, sizes: ['39-42', '43-46'], colors: ['trang', 'den'], categories: ['ankle-socks', 'men', 'summer'] },
  { slug: 'hop-qua-tet-4-doi', vi: 'Hộp quà Tết 4 đôi', en: 'Lunar New Year gift box, 4 pairs', price: 199_000, sizes: ['free'], colors: ['do'], categories: ['tet-gifts', 'cotton-socks'] },
  { slug: 'hop-qua-valentine-2-doi', vi: 'Hộp quà Valentine 2 đôi', en: "Valentine's gift box, 2 pairs", price: 129_000, sizes: ['free'], colors: ['hong', 'do'], categories: ['valentine', 'cotton-socks'] },
  { slug: 'hop-qua-83-3-doi', vi: 'Hộp quà 8/3 — 3 đôi', en: "Women's Day gift box, 3 pairs", price: 159_000, sizes: ['free'], colors: ['hong'], categories: ['womens-day', 'women'] },
  { slug: 'hop-qua-2010', vi: 'Hộp quà 20/10', en: "Vietnamese Women's Day gift box", price: 169_000, sizes: ['free'], colors: ['hong', 'be'], categories: ['vietnamese-womens-day', 'women'] },
  { slug: 'hop-qua-2011-thay-co', vi: 'Hộp quà 20/11 tặng thầy cô', en: "Teachers' Day gift box", price: 149_000, sizes: ['free'], colors: ['navy', 'xam'], categories: ['teachers-day', 'unisex'] },
  { slug: 'hop-qua-giang-sinh', vi: 'Hộp quà Giáng sinh', en: 'Christmas gift box', price: 179_000, sizes: ['free'], colors: ['do', 'xanh-reu'], categories: ['christmas', 'wool-socks', 'winter'] },
  { slug: 'co-ngan-mua-he-mong', vi: 'Tất cổ ngắn mùa hè mỏng', en: 'Light summer ankle socks', price: 27_000, sizes: ['35-38', '39-42'], colors: ['trang', 'be'], categories: ['ankle-socks', 'summer', 'unisex'] },
  { slug: 'luoi-mua-he', vi: 'Tất lưới mùa hè', en: 'Mesh summer socks', price: 33_000, sizes: ['35-38'], colors: ['trang', 'hong'], categories: ['ankle-socks', 'summer', 'women'] },
  { slug: 'co-cao-mua-thu-ke', vi: 'Tất cổ cao mùa thu kẻ', en: 'Autumn striped crew socks', price: 42_000, sizes: ['35-38', '39-42'], colors: ['nau', 'xanh-reu'], categories: ['crew-socks', 'autumn', 'unisex'] },
  { slug: 'co-cao-hoa-nho', vi: 'Tất cổ cao hoa nhỏ', en: 'Small floral crew socks', price: 46_000, sizes: ['35-38'], colors: ['be', 'hong'], categories: ['crew-socks', 'spring', 'women', 'da-nang-daily'] },
  { slug: 'mua-xuan-pastel', vi: 'Tất mùa xuân tông pastel', en: 'Pastel spring socks', price: 38_000, sizes: ['35-38', '39-42'], colors: ['hong', 'be'], categories: ['spring', 'cotton-socks', 'women', 'da-nang-daily'] },
  { slug: 'unisex-tron-combo', vi: 'Tất unisex trơn — mua combo', en: 'Plain unisex socks — combo', price: 26_000, sizes: ['35-38', '39-42', '43-46'], colors: ['den', 'xam', 'trang', 'navy'], categories: ['ankle-socks', 'unisex', 'all-season', 'da-nang-daily'] },
  { slug: 'co-cao-len-mong', vi: 'Tất cổ cao len mỏng', en: 'Light wool crew socks', price: 58_000, sizes: ['35-38', '39-42'], colors: ['xam', 'nau'], categories: ['wool-socks', 'autumn', 'unisex'] },
  { slug: 'chong-truot-tap-yoga', vi: 'Tất chống trượt tập yoga', en: 'Non-slip yoga socks', price: 65_000, sizes: ['free'], colors: ['hong', 'xam'], categories: ['women', 'all-season'] },
  { slug: 'co-cao-ke-caro-nam', vi: 'Tất cổ cao kẻ caro nam', en: "Checked men's crew socks", price: 48_000, sizes: ['39-42', '43-46'], colors: ['navy', 'nau'], categories: ['crew-socks', 'men', 'autumn'] },
  { slug: 'sinh-nhat-hop-2-doi', vi: 'Hộp quà sinh nhật 2 đôi', en: 'Birthday gift box, 2 pairs', price: 119_000, sizes: ['free'], colors: ['do', 'hong'], categories: ['birthday', 'cotton-socks'] },
];

export async function seedDemoProducts(db: Database): Promise<void> {
  const logger = new Logger('Seed');

  const optionRows = await db
    .select({ id: variantOptions.id, kind: variantOptions.kind, value: variantOptions.value })
    .from(variantOptions);
  const categoryRows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(inArray(categories.slug, [...new Set(DEMO.flatMap((item) => item.categories))]));

  const sizeId = new Map(
    optionRows.filter((row) => row.kind === VariantOptionKindEnum.SIZE).map((row) => [row.value, row.id]),
  );
  const colorId = new Map(
    optionRows.filter((row) => row.kind === VariantOptionKindEnum.COLOR).map((row) => [row.value, row.id]),
  );
  const categoryId = new Map(categoryRows.map((row) => [row.slug, row.id]));

  const productRows = DEMO.map((item) => ({
    id: crypto.randomUUID(),
    slug: item.slug,
    name: { vi: item.vi, en: item.en },
    priceMin: item.price,
    priceMax: item.price,
    isFeatured: item.price >= 100_000,
  }));

  const variantRows = DEMO.flatMap((item, index) =>
    item.sizes.flatMap((size) =>
      item.colors.map((color) => ({
        productId: productRows[index].id,
        sku: `${item.slug}-${size}-${color}`.toUpperCase(),
        sizeId: sizeId.get(size)!,
        colorId: colorId.get(color)!,
        price: item.price,
        stock: 20,
      })),
    ),
  );

  const linkRows = DEMO.flatMap((item, index) =>
    item.categories
      .filter((slug) => categoryId.has(slug))
      .map((slug, order) => ({
        productId: productRows[index].id,
        categoryId: categoryId.get(slug)!,
        sortOrder: order,
      })),
  );

  await insertInChunks(products, productRows, (chunk) =>
    db.insert(products).values(chunk).onConflictDoNothing(),
  );
  await insertInChunks(productVariants, variantRows, (chunk) =>
    db.insert(productVariants).values(chunk).onConflictDoNothing(),
  );
  await insertInChunks(productCategories, linkRows, (chunk) =>
    db.insert(productCategories).values(chunk).onConflictDoNothing(),
  );

  logger.log(
    `demo: ${productRows.length} sản phẩm, ${variantRows.length} biến thể, ${linkRows.length} liên kết category`,
  );
}
