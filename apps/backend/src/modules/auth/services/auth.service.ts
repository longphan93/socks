import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Env } from '../../../config/env.js';
import { AdminUserRepository } from '../repositories/admin-user.repository.js';
import { AuthenticatedAdminInterface, JwtPayloadInterface } from '../interfaces/index.js';
import { LoginDto } from '../http/dto/index.js';
import { AdminProfileResponse, LoginResponse } from '../http/responses/index.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly admins: AdminUserRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const admin = await this.admins.findByEmail(dto.email);

    // So sánh mật khẩu kể cả khi không có admin nào khớp email, để thời gian
    // phản hồi không tiết lộ email nào đang tồn tại.
    const passwordMatches = await compare(
      dto.password,
      admin?.passwordHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva',
    );

    if (!admin || !passwordMatches) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    const payload: JwtPayloadInterface = { sub: admin.id, email: admin.email };

    return {
      accessToken: await this.jwt.signAsync(payload),
      expiresIn: this.config.get('JWT_EXPIRES_IN', { infer: true }),
      admin: { id: admin.id, email: admin.email, name: admin.name },
    };
  }

  /** Guard gọi sau khi token hợp lệ, để chắc admin vẫn còn tồn tại. */
  async verifyAdmin(payload: JwtPayloadInterface): Promise<AuthenticatedAdminInterface> {
    const admin = await this.admins.findById(payload.sub);

    if (!admin) {
      throw new UnauthorizedException('auth.unauthorized');
    }

    return { id: admin.id, email: admin.email };
  }

  async profile(id: string): Promise<AdminProfileResponse> {
    const admin = await this.admins.findById(id);

    if (!admin) {
      throw new UnauthorizedException('auth.unauthorized');
    }

    return { id: admin.id, email: admin.email, name: admin.name };
  }
}
