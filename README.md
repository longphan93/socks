# Tất & Quà

Website bán tất theo mùa và quà tặng. Monorepo npm workspaces:

```
socks/
├── CLAUDE.md          quy ước code, cách làm việc theo phase
├── PLAN.md            14 phase kèm tiêu chí hoàn thành, quyết định đã chốt
├── Dockerfile         một image chứa cả hai app
├── apps/
│   ├── backend/       NestJS + Drizzle + Cloudflare D1 (cổng 4000)
│   └── frontend/      Next.js App Router + Tailwind (cổng 4001)
├── docker/start.mjs   chạy hai tiến trình trong một container
└── vendor/            bản vá tạm của @longphan93/nestjs-migration
```

## Chạy local

Cần Node 22+ và Docker (cho Mailpit).

```bash
npm install                 # cài cho cả hai app

cp apps/backend/.env.example apps/backend/.env
cp apps/backend/d1-gateway/.dev.vars.example apps/backend/d1-gateway/.dev.vars
cp apps/frontend/.env.example apps/frontend/.env

npm run dev:gateway         # cửa sổ 1 — Worker + D1 local, cổng 8787
npm run build && npm run db:migrate   # tạo bảng trên D1 local
npm run dev:backend         # cửa sổ 2 — API, cổng 4000
npm run dev:frontend        # cửa sổ 3 — web, cổng 4001
npm run mail:dev            # Mailpit, xem email ở http://localhost:8025
```

Kiểm tra nhanh: `curl http://localhost:4000/api/v1/health` phải trả
`{"data":{"status":"ok","database":"ok",...}}`. Swagger ở
http://localhost:4000/api/docs.

## Lệnh ở root

| Lệnh | Việc |
| --- | --- |
| `npm run build` | Build cả hai app |
| `npm run typecheck` / `lint` / `format` | Cả hai app |
| `npm test` / `npm run test:e2e` | Test backend |
| `npm run db:migrate` / `db:migrate:revert` | Migration (build trước) |
| `npm run docker:build` / `docker:run` | Image gộp |

Chạy lệnh riêng cho một app: `npm run <script> -w @socks/backend`.

## Docker

```bash
npm run docker:build
docker run --rm -p 4000:4000 -p 4001:4001 --env-file apps/backend/.env socks:local
```

Một image, hai tiến trình. Entrypoint chạy migration trước — migrate hỏng thì
container không start. `docker/start.mjs` giám sát cả hai: một tiến trình chết
là container dừng, để orchestrator không thấy container "khoẻ" trong khi một
nửa ứng dụng đã chết.

Production nên đặt reverse proxy trước container: `/api` sang 4000, còn lại
sang 4001.

## Trước khi dùng D1 và R2 thật

```bash
cd apps/backend
npx wrangler login
npx wrangler d1 create socks-db        # chép database_id vào d1-gateway/wrangler.toml
npx wrangler secret put GATEWAY_SECRET --config d1-gateway/wrangler.toml
npm run gateway:deploy                 # lấy URL Worker, điền vào D1_GATEWAY_URL
cd ../.. && npm run build && npm run db:migrate
```

Bucket R2 `socks-media` cần CORS cho phép `PUT` từ domain FE và localhost.
Kiểm tra bằng `npm run r2:test -w @socks/backend`.
