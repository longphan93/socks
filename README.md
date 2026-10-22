# Tất & Quà — Backend

NestJS + Drizzle ORM trên Cloudflare D1. Repo này cũng giữ tài liệu chung của
cả dự án:

- [CLAUDE.md](./CLAUDE.md) — stack, quy ước code, cách làm việc theo phase
- [PLAN.md](./PLAN.md) — 14 phase kèm tiêu chí hoàn thành, các quyết định đã chốt, phác thảo schema

Frontend nằm ở repo riêng: https://github.com/longphan93/socks-frontend

## Chạy local

Cần Node 22+ và Docker (cho Mailpit). Backend ở cổng 4000, frontend ở 4001.

```bash
# Backend
cd backend
npm install
cp .env.example .env                                   # sửa D1_GATEWAY_SECRET nếu muốn
cp d1-gateway/.dev.vars.example d1-gateway/.dev.vars   # GATEWAY_SECRET phải trùng .env

npm run gateway:dev        # cửa sổ 1 — Worker + D1 local, cổng 8787
npm run db:migrate:local   # áp migration lên D1 local
npm run start:dev          # cửa sổ 2 — API ở cổng 4000
npm run mail:dev           # cửa sổ 3 — Mailpit, xem email ở http://localhost:8025

# Frontend (clone từ repo socks-frontend)
cd ../frontend
npm install
cp .env.example .env
npm run dev                # http://localhost:4001
```

Kiểm tra nhanh: `curl http://localhost:4000/api/v1/health` phải trả
`{"data":{"status":"ok","database":"ok",...}}`. Swagger ở
http://localhost:4000/api/docs.

## Trước khi dùng D1 và R2 thật

```bash
npx wrangler login
npx wrangler d1 create socks-db        # chép database_id vào d1-gateway/wrangler.toml
npx wrangler secret put GATEWAY_SECRET --config d1-gateway/wrangler.toml
npm run gateway:deploy                 # lấy URL Worker, điền vào D1_GATEWAY_URL
npm run db:migrate:remote
```

Bucket R2 `socks-media` cần CORS cho phép `PUT` từ domain FE và localhost.
Kiểm tra bằng `npm run r2:test`.

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
`x-gateway-secret` rồi chạy trên D1. Phía NestJS dùng Drizzle `sqlite-proxy`
gọi sang.

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
