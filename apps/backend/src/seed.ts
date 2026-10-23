import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Env } from './config/env.js';
import { DRIZZLE, type Database } from './database/drizzle.provider.js';
import { seedAdminUser } from './database/seeders/admin-user.seeder.js';
import { seedCategories } from './database/seeders/category.seeder.js';
import { seedDemoProducts } from './database/seeders/demo-product.seeder.js';
import { seedSettings } from './database/seeders/setting.seeder.js';
import { seedShippingMethods } from './database/seeders/shipping-method.seeder.js';
import { seedVariantOptions } from './database/seeders/variant-option.seeder.js';

/**
 * Nạp dữ liệu khởi điểm. Chạy lại được nhiều lần: mọi insert đều
 * `onConflictDoNothing` nên không tạo bản ghi trùng.
 *
 *   node dist/seed              dữ liệu cấu trúc
 *   SEED_DEMO=true node dist/seed   kèm ~30 sản phẩm mẫu
 */
async function seed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: false });

  try {
    const db = app.get<Database>(DRIZZLE);
    const config = app.get(ConfigService<Env, true>);

    await seedVariantOptions(db);
    await seedCategories(db);
    await seedShippingMethods(db);
    await seedSettings(db);
    await seedAdminUser(
      db,
      config.get('ADMIN_EMAIL', { infer: true }),
      config.get('ADMIN_PASSWORD', { infer: true }),
    );

    if (process.env.SEED_DEMO === 'true') {
      await seedDemoProducts(db);
    } else {
      logger.log('Bỏ qua sản phẩm mẫu (đặt SEED_DEMO=true nếu muốn)');
    }

    logger.log('Seed xong');
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    await app.close();
    process.exit(1);
  }

  await app.close();
}

await seed();
