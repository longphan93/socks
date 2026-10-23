import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../../config/env.js';
import { AuthService } from '../services/auth.service.js';
import type { AdminUserRepository } from '../repositories/admin-user.repository.js';

const PASSWORD = 'admin12345';

let admin: { id: string; email: string; name: string; passwordHash: string; createdAt: string };

beforeAll(async () => {
  admin = {
    id: 'admin-1',
    email: 'admin@shop.test',
    name: 'Quản trị viên',
    passwordHash: await hash(PASSWORD, 4),
    createdAt: '2026-10-23 00:00:00',
  };
});

function makeService(found: typeof admin | undefined) {
  const admins = {
    findByEmail: vi.fn().mockResolvedValue(found),
    findById: vi.fn().mockResolvedValue(found),
  } as unknown as AdminUserRepository;

  const signAsync = vi.fn().mockResolvedValue('signed.jwt.token');
  const jwt = { signAsync } as unknown as JwtService;
  const config = { get: () => '7d' } as unknown as ConfigService<Env, true>;

  return { service: new AuthService(admins, jwt, config), admins, signAsync };
}

describe('AuthService.login', () => {
  it('trả access token và hồ sơ khi đúng mật khẩu', async () => {
    const { service, signAsync } = makeService(admin);

    const result = await service.login({ email: admin.email, password: PASSWORD });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.admin).toEqual({ id: 'admin-1', email: admin.email, name: 'Quản trị viên' });
    expect(signAsync).toHaveBeenCalledWith({ sub: 'admin-1', email: admin.email });
  });

  it('từ chối khi sai mật khẩu', async () => {
    const { service } = makeService(admin);

    await expect(
      service.login({ email: admin.email, password: 'sai-mat-khau' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('ném cùng một lỗi khi email không tồn tại — không tiết lộ email nào có thật', async () => {
    const missing = makeService(undefined);
    const wrongPassword = makeService(admin);

    const a = await missing.service
      .login({ email: 'khong-co@shop.test', password: PASSWORD })
      .catch((error: Error) => error.message);
    const b = await wrongPassword.service
      .login({ email: admin.email, password: 'sai' })
      .catch((error: Error) => error.message);

    expect(a).toBe('auth.invalid_credentials');
    expect(b).toBe(a);
  });

  it('lỗi là i18n key chứ không phải câu tiếng Việt', async () => {
    const { service } = makeService(undefined);

    await expect(service.login({ email: 'x@y.test', password: PASSWORD })).rejects.toThrow(
      /^auth\./,
    );
  });
});

describe('AuthService.verifyAdmin', () => {
  it('từ chối token của admin đã bị xoá', async () => {
    const { service } = makeService(undefined);

    await expect(service.verifyAdmin({ sub: 'admin-1', email: admin.email })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
