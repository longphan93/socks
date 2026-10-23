import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../constants/index.js';
import { AuthService } from '../services/auth.service.js';
import { JwtPayloadInterface } from '../interfaces/index.js';

/**
 * Guard đăng ký global: mọi route đều cần token trừ khi gắn `@Public()`.
 *
 * Mặc định đóng thay vì mặc định mở, để route admin thêm sau này không thể
 * quên bảo vệ.
 */
@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('auth.unauthorized');
    }

    let payload: JwtPayloadInterface;

    try {
      payload = await this.jwt.verifyAsync<JwtPayloadInterface>(token);
    } catch {
      throw new UnauthorizedException('auth.token_expired');
    }

    request.admin = await this.auth.verifyAdmin(payload);

    return true;
  }
}

function extractBearerToken(header?: string): string | null {
  const [scheme, token] = (header ?? '').split(' ');

  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}
