# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Sản phẩm

Website bán tất/vớ theo mùa và quà tặng, thị trường Việt Nam. Giao diện tiếng
Việt, tiền VND. MVP không có tài khoản khách hàng và không thanh toán online:
khách đặt hàng vãng lai, team gọi xác nhận thủ công (COD).

## Cấu trúc

Một repo duy nhất, npm workspaces:

```
socks/
├── CLAUDE.md          ← file này
├── PLAN.md            ← danh sách phase và task, tick khi xong
├── Dockerfile         một image chứa cả hai app
├── docker/start.mjs   chạy hai tiến trình trong một container
├── vendor/            bản vá tạm của @longphan93/nestjs-migration
└── apps/
    ├── backend/       @socks/backend — NestJS (cổng 4000)
    │   ├── src/
    │   ├── d1-gateway/    Cloudflare Worker có D1 binding
    │   └── scripts/
    └── frontend/      @socks/frontend — Next.js App Router (cổng 4001)
        ├── app/
        ├── components/    ui/ (design system) và layout/
        └── lib/           api/, cart/, tiện ích
```

Lệnh chạy ở root; nhắm vào một app bằng `npm run <script> -w @socks/backend`.

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

- ORM là Drizzle với driver `sqlite-proxy`, dùng cho **truy vấn**. Không dùng Prisma.
- **Schema do migration viết tay quyết định**, không sinh từ Drizzle schema. Xem
  `src/database/migrations/README.md`.
- **D1 không có transaction tương tác.** Thao tác nhiều bước (tạo đơn và trừ
  kho) phải dùng `db.batch([...])` — batch của D1 là nguyên tử — kết hợp ràng
  buộc `CHECK` trong schema.
- Lệnh ghi không bao giờ được thử lại tự động. Chỉ `SELECT/WITH/PRAGMA/EXPLAIN`
  mới retry khi lỗi mạng.
- Mỗi truy vấn là một lượt gọi HTTPS. Dữ liệu catalog đọc nhiều, đổi ít thì đi
  qua `MemoryCacheService` (`CATALOG_CACHE_TTL_MS`).

## Migration

Viết tay bằng DSL của `@longphan93/nestjs-migration` — cùng thư viện với các dự
án khác của team. Thư viện chỉ có executor cho TypeORM và Sequelize, cả hai đều
không nối tới D1 được, nên dự án này có executor riêng
`src/database/executors/d1-gateway.executor.ts` sinh thẳng DDL SQLite và đẩy
qua gateway trong một batch nguyên tử.

Đọc `src/database/migrations/README.md` **trước khi** đụng tới schema: quy tắc
đặt tên, một bảng một file, và các giới hạn của SQLite mà executor sẽ chặn
(không thêm được khoá chính / khoá ngoại vào bảng đã tồn tại).

## Lệnh

Backend (`-w @socks/backend`):

| Lệnh | Việc |
| --- | --- |
| `npm run gateway:dev` | Worker + D1 local ở cổng 8787 (chạy trước) |
| `npm run start:dev` | NestJS watch mode |
| `npm run build && npm run db:migrate` | Chạy migration chưa áp dụng |
| `npm run build && npm run db:migrate:revert` | Quay lui migration mới nhất |
| `npm run mail:dev` | Mailpit qua Docker |
| `npm run r2:test` | Thử presigned upload lên R2 |
| `npm run typecheck` / `lint` / `test` / `test:e2e` / `build` | |

Frontend (`-w @socks/frontend`): `npm run dev` (cổng 4001), `typecheck`,
`lint`, `format`, `build`.

`npm install` chạy ở root cho cả hai app và cần `legacy-peer-deps` (đã đặt sẵn
trong `.npmrc` ở root) vì npm 10 gặp lỗi khi giải peer dependency vòng của
`vite@8`/`vitest@4`.

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

## Quy ước lấy từ ok-danang-ecosystem

Giữ chung với các dự án khác của team:

- **Hậu tố nói rõ loại.** `…Enum`, `…Interface`, `…Type`, `…Service`,
  `…Repository`, `…Response`; file `.service.ts`, `.enum.ts`, `.constant.ts`,
  `.interface.ts`, `.helper.ts`, `.executor.ts`.
- **Một khai báo xuất ra mỗi file.** Không để `const`, `interface` hay `type` ở
  đầu file service / executor / helper — chúng nằm trong `constants/` hoặc
  `interfaces/`, mỗi thứ một file, re-export qua `index.ts`.
- **Barrel cho `constants/`, `enums/`, `interfaces/`** (không cho `services/`,
  `helpers/`, `executors/`). Import từ thư mục, không từ file; file bên trong
  thư mục thì import thẳng file anh em, không đi qua barrel của chính nó.
- **Có enum thì dùng enum**, không gõ lại giá trị dưới dạng chuỗi thô.
- **Tối đa 3 tham số vị trí**; quá thì gom thành một params object có interface
  riêng.
- **Không query trong vòng lặp.** Đọc một lần bằng `IN`, ghi một câu lệnh.
- **Nhịp dòng trống**: một dòng trống trước `return`, quanh `if`/`for`/`while`/
  `try`, và sau cụm khai báo `const`/`let`.
- **Rất ít comment.** Chỉ viết khi người đọc sẽ undo mất một quyết định.
- Prettier: single quote, trailing comma, 100 cột, semi, 2 space.

Chưa áp dụng (khác stack, ghi lại để khỏi tranh luận lại): `BaseRepository` và
`dataSource.transaction` của TypeORM, guard phân quyền nhiều vai, i18n ba thứ
tiếng. Response envelope giữ `{ data, message, meta }` theo PLAN, không dùng
`{ success, data, timestamp }` của bên kia.

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
