# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Sản phẩm

Website bán tất/vớ theo mùa và quà tặng, thị trường Việt Nam. Giao diện tiếng
Việt, tiền VND. MVP không có tài khoản khách hàng và không thanh toán online:
khách đặt hàng vãng lai, team gọi xác nhận thủ công (COD).

## Cấu trúc

Hai repo riêng biệt, cùng nằm trong thư mục `socks/` khi làm local:

```
socks/
├── backend/           repo socks-backend — NestJS (cổng 4000)
│   ├── CLAUDE.md      ← file này
│   ├── PLAN.md        ← danh sách phase và task, tick khi xong
│   ├── src/
│   ├── d1-gateway/    Cloudflare Worker có D1 binding
│   ├── migrations/    SQL do drizzle-kit sinh
│   └── scripts/
└── frontend/          repo socks-frontend — Next.js App Router (cổng 4001)
    ├── app/
    ├── components/    ui/ (design system) và layout/
    └── lib/           api/, cart/, tiện ích
```

Tài liệu chung (`CLAUDE.md`, `PLAN.md`) ở trong repo backend; Dockerfile của
Phase 13 cũng sẽ đặt ở đó.

Tài liệu kế hoạch gốc chép thư mục là `apps/backend`, `apps/frontend`. Repo
thật dùng `backend/`, `frontend/` ở cùng cấp — giữ nguyên, không đổi.
`d1-gateway` nằm trong `backend/` vì nó dùng chung thư mục `migrations/`.

## Stack

| Phần | Công nghệ |
| --- | --- |
| Backend | NestJS 12, TypeScript ESM, Drizzle ORM |
| Database | Cloudflare D1 (SQLite), truy cập qua Worker gateway |
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS v4, Zustand |
| Lưu trữ ảnh | Cloudflare R2, upload bằng presigned URL |
| Email | SMTP (dev: Mailpit ở cổng 1025, web UI 8025) |
| Test | Vitest (`*.spec.ts` unit, `*.e2e-spec.ts` e2e) |
| Lint | oxlint (BE), ESLint (FE), Prettier cả hai |

## Cách truy cập database

NestJS chạy trên Node trong Docker nên **không có D1 binding**. Mọi truy vấn đi
qua `backend/d1-gateway` — một Worker nhận `{ sql, params, method }` qua HTTPS,
xác thực bằng header `x-gateway-secret`, chạy trên binding `DB`.

- ORM là Drizzle với driver `sqlite-proxy`. Không dùng Prisma.
- **D1 không có transaction tương tác.** Thao tác nhiều bước (tạo đơn và trừ
  kho) phải dùng `db.batch([...])` — batch của D1 là nguyên tử — kết hợp ràng
  buộc `CHECK` trong schema.
- Lệnh ghi không bao giờ được thử lại tự động. Chỉ `SELECT/WITH/PRAGMA/EXPLAIN`
  mới retry khi lỗi mạng.
- Mỗi truy vấn là một lượt gọi HTTPS. Dữ liệu catalog đọc nhiều, đổi ít thì đi
  qua `MemoryCacheService` (`CATALOG_CACHE_TTL_MS`).

## Lệnh

Backend (`cd backend`):

| Lệnh | Việc |
| --- | --- |
| `npm run gateway:dev` | Worker + D1 local ở cổng 8787 (chạy trước) |
| `npm run start:dev` | NestJS watch mode |
| `npm run db:generate` | Sinh migration từ `src/database/schema/` |
| `npm run db:migrate:local` | Áp migration lên D1 local |
| `npm run db:migrate:remote` | Áp migration lên D1 thật |
| `npm run mail:dev` | Mailpit qua Docker |
| `npm run r2:test` | Thử presigned upload lên R2 |
| `npm run typecheck` / `lint` / `test` / `test:e2e` / `build` | |

Frontend (`cd frontend`): `npm run dev` (cổng 4001), `typecheck`, `lint`,
`format`, `build`.

`npm install` ở backend cần `legacy-peer-deps` (đã đặt sẵn trong `.npmrc`) vì
npm 10 gặp lỗi khi giải peer dependency vòng của `vite@8`/`vitest@4`.

## Quy ước

**Đặt tên.** File `kebab-case.ts`. Class `PascalCase`, biến/hàm `camelCase`,
hằng số `SCREAMING_SNAKE_CASE`. Cột DB `snake_case` (Drizzle đặt
`casing: 'snake_case'` nên code viết camelCase là đủ). URL tiếng Anh:
`/categories/[slug]`, `/gifts`, `/products/[slug]`, `/cart`, `/checkout`.

**Import trong backend.** Dự án là ESM `nodenext` — import file nội bộ phải có
đuôi `.js`: `import { Env } from './config/env.js'`.

**Tiền.** Luôn là số nguyên VND. Không dùng float. FE hiển thị qua
`formatVnd()`.

**Trạng thái.** Lưu dạng text trong DB, kèm hằng số TypeScript. Trạng thái đơn:
`PENDING_CONFIRMATION`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `COMPLETED`,
`CANCELLED`.

**Category.** Không có bảng Season. Category có trường `group`: `SEASON`,
`TYPE`, `AUDIENCE`, `OCCASION`. Product thuộc nhiều category (many-to-many).
Trang `/gifts` lọc theo category nhóm `OCCASION`.

**Không làm trong MVP.** Season, GiftBox, GiftBoxItem, GiftOccasion,
WrappingOption, Cart, CartItem, Coupon, Payment, tài khoản khách, đánh giá sản
phẩm. Thấy code hoặc model nào thuộc nhóm này thì xoá luôn.

## Định dạng response API

Mọi response, kể cả lỗi, đều có hình dạng:

```json
{ "data": ..., "message": "...hoặc null", "meta": { ... } }
```

- Controller trả giá trị trần thì `ResponseInterceptor` tự bọc.
- Cần kèm message hoặc meta thì trả `respond(data, { message, meta })`.
- Lỗi: `data` là `null`, `meta` chứa `statusCode`, `path`, `timestamp`, và
  `errors` (mảng chuỗi) khi lỗi validate.
- Prefix `/api/v1`. Swagger ở `/api/docs` (tắt ở production).
- FE gọi qua `apiFetch()` — hàm này đã mở sẵn envelope và trả thẳng `data`.

## Quy tắc commit

Conventional Commits, tiếng Anh ở phần type/scope, mô tả tiếng Việt hoặc Anh
đều được:

```
feat(catalog): them endpoint loc san pham theo nhieu category
fix(orders): khong tru kho khi don bi huy
chore(deps): nang drizzle-orm
```

Một task trong PLAN.md là một commit. Chạy lint, typecheck và test liên quan
trước khi commit.

## Cách làm việc theo phase

PLAN.md chia công việc thành 14 phase. Mỗi lần chỉ làm **một** phase:

1. Liệt kê task con trước khi code.
2. Làm lần lượt, sau mỗi task chạy lint/build/test tới khi pass.
3. Tick `[x]` vào PLAN.md.
4. Không sửa code ngoài phạm vi phase. Thấy cần sửa phase trước thì hỏi trước.
