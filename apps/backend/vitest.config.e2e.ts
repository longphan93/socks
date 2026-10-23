import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // ConfigModule.forRoot() validate ngay lúc import app.module, tức là trước
    // khi thân file test chạy, nên env phải được đặt từ đây.
    env: {
      NODE_ENV: 'test',
      // Không có gateway nào nghe ở cổng này: health phải báo degraded, không được sập.
      D1_GATEWAY_URL: 'http://127.0.0.1:59999',
      D1_GATEWAY_SECRET: 'secret-du-dai-16-ky-tu',
      D1_GATEWAY_TIMEOUT_MS: '300',
      D1_GATEWAY_RETRIES: '0',
      JWT_SECRET: 'test-secret-toi-thieu-32-ky-tu-cho-vitest',
    },
  },
});
