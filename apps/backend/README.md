# Backend

NestJS + Drizzle ORM trên Cloudflare D1. Cách chạy cả monorepo: [../../README.md](../../README.md).
Quy ước code: [../../CLAUDE.md](../../CLAUDE.md).

## Cấu trúc

```
src/
├── common/      interceptor, exception filter, cache dùng chung
├── config/      validate biến môi trường
├── database/    gateway client, Drizzle, executor và runner migration
├── health/      GET /api/v1/health
d1-gateway/      Worker có D1 binding, nhận SQL qua HTTPS
scripts/         tiện ích chạy tay
```

## Vì sao có d1-gateway

NestJS chạy trên Node trong Docker nên không có D1 binding. `d1-gateway` là
Worker nhỏ có binding, nhận `{ sql, params, method }` kèm header
`x-gateway-secret` rồi chạy trên D1. Phía NestJS dùng Drizzle `sqlite-proxy`
gọi sang.

D1 không có transaction tương tác — thao tác nhiều bước dùng `db.batch([...])`
(nguyên tử) kết hợp ràng buộc `CHECK` trong schema.

## Migration

Viết tay bằng DSL của `@longphan93/nestjs-migration`, chạy qua
`D1GatewayExecutor`. Đọc [src/database/migrations/README.md](src/database/migrations/README.md)
trước khi đụng tới schema.

## Lệnh riêng của app này

Chạy từ root bằng `npm run <script> -w @socks/backend`, hoặc `cd apps/backend`:

| Lệnh | Việc |
| --- | --- |
| `npm run gateway:dev` | Worker + D1 local, cổng 8787 |
| `npm run start:dev` | API watch mode, cổng 4000 |
| `npm run db:migrate` / `:revert` | Migration (build trước) |
| `npm run typecheck` / `lint` / `test` / `test:e2e` / `build` | |
| `npm run mail:dev` | Mailpit |
| `npm run r2:test` | Thử presigned upload lên R2 |
