import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Env } from '../../config/env.js';
import { AuthController } from './http/controllers/auth.controller.js';
import { AdminUserRepository } from './repositories/admin-user.repository.js';
import { AuthService } from './services/auth.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminUserRepository],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
