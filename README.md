# Backend

NestJS + Drizzle ORM trên Cloudflare D1. Xem [../README.md](../README.md) để
chạy local, [../CLAUDE.md](../CLAUDE.md) cho quy ước code.

## Cấu trúc

```
src/
├── common/      interceptor, exception filter, cache dùng chung
├── config/      validate biến môi trường
├── database/    client gateway + instance Drizzle
├── health/      GET /api/v1/health
d1-gateway/      Worker có D1 binding, nhận SQL qua HTTPS
migrations/      SQL do drizzle-kit sinh
scripts/         tiện ích chạy tay
```

## Vì sao có d1-gateway

NestJS chạy trên Node trong Docker nên không có D1 binding. `d1-gateway` là
Worker nhỏ có binding, nhận `{ sql, params, method }` kèm header
`x-gateway-secret` rồi chạy trên D1. Phía NestJS dùng Drizzle
`sqlite-proxy` gọi sang.

D1 không có transaction tương tác — thao tác nhiều bước dùng `db.batch([...])`
(nguyên tử) kết hợp ràng buộc `CHECK` trong schema.

## Lệnh hay dùng

| Lệnh | Việc |
| --- | --- |
| `npm run gateway:dev` | Worker + D1 local, cổng 8787 |
| `npm run start:dev` | API watch mode, cổng 4000 |
| `npm run db:generate` | Sinh migration từ `src/database/schema/` |
| `npm run db:migrate:local` / `:remote` | Áp migration |
| `npm run typecheck` / `lint` / `test` / `test:e2e` / `build` | |
| `npm run mail:dev` | Mailpit |
| `npm run r2:test` | Thử presigned upload lên R2 |

`npm install` dùng `legacy-peer-deps` (đặt trong `.npmrc`) vì npm 10 lỗi khi
giải peer dependency vòng của `vite@8`/`vitest@4`.
