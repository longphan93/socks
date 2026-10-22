import { defineConfig } from 'drizzle-kit';

/**
 * Chỉ dùng để sinh file SQL migration (`npm run db:generate`).
 * Việc áp dụng migration do `wrangler d1 migrations apply` lo, cấu hình nằm ở
 * d1-gateway/wrangler.toml (migrations_dir trỏ về thư mục này).
 */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/database/schema/index.ts',
  out: './migrations',
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
