import { describe, expect, it } from 'vitest';
import { NodeEnv, splitOrigins, validateEnv } from './env.js';

const valid = {
  D1_GATEWAY_URL: 'http://127.0.0.1:8787',
  D1_GATEWAY_SECRET: 'secret-du-dai-16-ky-tu',
};

describe('validateEnv', () => {
  it('điền giá trị mặc định khi biến không bắt buộc bị thiếu', () => {
    const env = validateEnv({ ...valid });

    expect(env.NODE_ENV).toBe(NodeEnv.Development);
    expect(env.PORT).toBe(4000);
    expect(env.D1_GATEWAY_RETRIES).toBe(2);
  });

  it('ép kiểu số và boolean từ chuỗi', () => {
    const env = validateEnv({
      ...valid,
      PORT: '4000',
      SMTP_PORT: '1025',
      SMTP_SECURE: 'false',
    });

    expect(env.PORT).toBe(4000);
    expect(env.SMTP_PORT).toBe(1025);
    expect(env.SMTP_SECURE).toBe(false);
  });

  it('báo lỗi khi thiếu cấu hình gateway', () => {
    expect(() => validateEnv({})).toThrow(/D1_GATEWAY_URL/);
  });

  it('báo lỗi khi secret quá ngắn', () => {
    expect(() => validateEnv({ ...valid, D1_GATEWAY_SECRET: 'ngan' })).toThrow(
      /D1_GATEWAY_SECRET/,
    );
  });

  it('bỏ qua nhóm biến chưa tới phase dùng đến', () => {
    expect(() => validateEnv({ ...valid })).not.toThrow();
  });

  it('vẫn kiểm tra kiểu của biến tuỳ chọn khi có mặt', () => {
    expect(() =>
      validateEnv({ ...valid, ADMIN_EMAIL: 'khong-phai-email' }),
    ).toThrow(/ADMIN_EMAIL/);
  });
});

describe('splitOrigins', () => {
  it('tách theo dấu phẩy và bỏ khoảng trắng thừa', () => {
    expect(splitOrigins('http://a.test, http://b.test ,')).toEqual([
      'http://a.test',
      'http://b.test',
    ]);
  });
});
