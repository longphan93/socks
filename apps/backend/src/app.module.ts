import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './common/cache/cache.module.js';
import { I18nThrottlerGuard } from './common/guards/i18n-throttler.guard.js';
import { I18nModule } from './common/i18n/i18n.module.js';
import { Env, validateEnv } from './config/env.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
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
        throttlers: [
          // Mức chung cho mọi route.
          { name: 'default', ttl: 60_000, limit: 120 },
          // Mức riêng cho đăng nhập, gắn bằng @Throttle({ login: {} }).
          {
            name: 'login',
            ttl: config.get('LOGIN_THROTTLE_TTL_MS', { infer: true }),
            limit: config.get('LOGIN_THROTTLE_LIMIT', { infer: true }),
          },
        ],
      }),
    }),
    I18nModule,
    CacheModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    // Guard mặc định đóng: route mới thêm mà quên bảo vệ thì vẫn cần token.
    { provide: APP_GUARD, useClass: AdminJwtGuard },
    { provide: APP_GUARD, useClass: I18nThrottlerGuard },
  ],
})
export class AppModule {}
