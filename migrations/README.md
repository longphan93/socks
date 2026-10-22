# Migrations

File SQL ở đây do `npm run db:generate` (drizzle-kit) sinh ra từ
`src/database/schema/`. Không sửa tay file đã áp dụng.

- Áp dụng khi dev: `npm run db:migrate:local`
- Áp dụng lên D1 thật: `npm run db:migrate:remote`
- `npm run start:prod` tự chạy migrate trước khi start server; migrate lỗi thì
  server không khởi động.

`d1-gateway/wrangler.toml` trỏ `migrations_dir` về thư mục này.
