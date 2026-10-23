import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './common/cache/cache.module.js';
import { I18nThrottlerGuard } from './common/guards/i18n-throttler.guard.js';
import { I18nModule } from './common/i18n/i18n.module.js';
import { Env, validateEnv } from './config/env.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { AdminJwtGuard } from './modules/auth/guards/admin-jwt.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        // Chỉ một throttler: throttler đặt tên trong cấu hình toàn cục sẽ áp
        // cho MỌI route, nên không dùng được để giới hạn riêng một route.
        // Giới hạn đăng nhập nằm ở LoginAttemptService.
        throttlers: [
          { ttl: 60_000, limit: config.get('THROTTLE_LIMIT', { infer: true }) },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    I18nModule,
    CacheModule,
    DatabaseModule,
    AuthModule,
    UploadModule,
    CatalogModule,
    HealthModule,
  ],
  providers: [
    // Guard mặc định đóng: route mới thêm mà quên bảo vệ thì vẫn cần token.
    { provide: APP_GUARD, useClass: AdminJwtGuard },
    { provide: APP_GUARD, useClass: I18nThrottlerGuard },
  ],
})
export class AppModule {}
