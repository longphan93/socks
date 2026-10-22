# PLAN.md

Làm tuần tự từ Phase 0 đến Phase 13. Chỉ sang phase mới khi đạt dòng **Xong khi**.
Phase 0–8 là backend, 9–12 là frontend, 13 là hoàn thiện và deploy.

Tick `[x]` ngay sau khi task chạy được và đã chạy lint/test.

---

## Phase 0 — Nền tảng chung

- [ ] Cloudflare: tạo D1 database `socks-db` (`wrangler d1 create socks-db`), bucket R2 `socks-media`, R2 API token, Cloudflare API token có quyền D1 Edit
- [ ] Cấu hình CORS cho bucket R2: cho phép `PUT` từ domain FE và localhost
- [x] Tạo `backend/d1-gateway` (Worker) với `wrangler.toml` khai báo D1 binding
- [x] `.env.example` cho BE (gateway, Cloudflare, R2, SMTP, admin seed, feedback) và FE (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`)
- [x] Thêm `.wrangler/` và `.dev.vars` vào `.gitignore`
- [x] Mailpit chạy local để xem email khi dev (`npm run mail:dev`)
- [x] ESLint + Prettier đồng bộ, script `dev`/`build`/`lint` chạy được cả 3 app; bật CORS ở BE

> **Xong khi:** BE và FE chạy không lỗi, script thử presigned upload lên R2 thành công (`npm run r2:test`), email test hiện trong Mailpit.
>
> Hai task đầu phải làm trên dashboard/CLI Cloudflare bằng tài khoản thật. `npm run r2:test` chỉ pass sau khi có bucket và token.

---

## Phase 1 — BE core và migration tự động

- [x] D1 gateway Worker: `POST /query` và `POST /batch` nhận SQL + params, chạy qua D1 binding (`prepare().bind()`, `batch()`), trả rows; bắt buộc header secret, chỉ nhận request HTTPS, log lỗi
- [x] `DatabaseModule` trong NestJS: Drizzle `sqlite-proxy` gọi gateway, có timeout và retry cho lỗi mạng (không retry lệnh ghi)
- [x] Migration: viết tay bằng DSL `@longphan93/nestjs-migration`, chạy qua `D1GatewayExecutor` tự viết (thư viện chỉ có executor TypeORM/Sequelize, không nối được D1)
- [x] Migration tự chạy khi khởi động: `start:prod` = `npm run db:migrate && node dist/main`; migrate lỗi thì exit 1, server không khởi động
- [x] Dev local: `wrangler dev` chạy gateway với D1 local; `db:migrate` chạy thẳng vào đó
- [x] `ConfigModule` validate biến môi trường (gateway, Cloudflare, R2, SMTP)
- [x] `ValidationPipe` global, exception filter, interceptor chuẩn hoá response `{ data, message, meta }`
- [x] Swagger tại `/api/docs`, prefix `/api/v1`
- [x] Cache catalog (in-memory, TTL ngắn) vì mỗi truy vấn D1 là một lượt gọi HTTPS

> **Xong khi:** khởi động BE với DB trống thì tự tạo đủ bảng, `/api/v1/health` trả OK.
>
> Đường ống migration đã chạy được (đã thử với một migration nháp rồi xoá). Phần "tạo đủ bảng" hoàn tất khi Phase 2 khai báo schema. `/api/v1/health` trả `{"database":"ok"}` khi gateway sống.

---

## Phase 2 — Database schema MVP

- [ ] Xoá model và code liên quan: Season, GiftBox, GiftBoxItem, GiftOccasion, WrappingOption, Cart, CartItem, Coupon, Payment, Address, Review, tài khoản khách
- [ ] `AdminUser`: email, passwordHash, name
- [ ] `Category`: name, slug, group (`SEASON`/`TYPE`/`AUDIENCE`/`OCCASION`), description, imageUrl, sortOrder, isActive, isFeatured
- [ ] `ProductCategory`: bảng nối many-to-many tường minh (productId, categoryId, sortOrder)
- [ ] `Product`, `ProductVariant` (size, màu, SKU, giá, tồn kho), `ProductImage` (r2Key, url, sortOrder)
- [ ] `VariantOption`: danh sách size và màu do admin quản lý (kind, value, label, hexColor, sortOrder) — biến thể tham chiếu vào đây để bộ lọc Phase 4 không bị tách giá trị
- [ ] `Setting`: key/value cho phí ship và các tham số admin sửa được mà không cần deploy
- [ ] `Order`: code (`SK-YYYYMMDD-XXXX`), customerName, email, phone, province, ward, street, note, subtotal, shippingFee, total, status, internalNote
- [ ] `OrderItem`: snapshot tên, biến thể, đơn giá, số lượng
- [ ] `OrderStatusHistory`: fromStatus, toStatus, note, changedBy, createdAt
- [ ] `Shipment` (chuẩn bị cho đơn vị vận chuyển): orderId, provider (`MANUAL` mặc định), trackingCode, status, fee, rawPayload
- [ ] `EmailLog`: orderId, type (`ORDER_CONFIRMATION`/`FEEDBACK_REQUEST`/`ADMIN_NEW_ORDER`), status, attempts, error; **unique (orderId, type)** để chống gửi trùng
- [ ] Quy ước: tiền `integer` (VND), status/group lưu `text` + hằng số TS; index cho slug, sku, status, createdAt. Mỗi bảng một file migration
- [ ] Seed: category đủ 4 nhóm (5 mùa là category nhóm SEASON), ~30 sản phẩm gán nhiều category, 1 admin từ env, size/màu mặc định, `shipping.fee = 20000`, `shipping.free_from = 300000`

> **Xong khi:** migrate + seed chạy sạch, không còn tham chiếu nào tới model đã xoá (`grep` sạch, build pass).

Phác thảo schema ở [phụ lục cuối file](#phụ-lục--phác-thảo-drizzle-schema).

---

## Phase 3 — BE Admin auth

- [ ] Đăng nhập admin, JWT access token (+ refresh tuỳ chọn), guard cho toàn bộ route `/admin/*`
- [ ] Không có đăng ký; admin tạo từ seed hoặc CLI script
- [ ] Giới hạn số lần đăng nhập sai bằng `@nestjs/throttler`

> **Xong khi:** mọi route `/api/v1/admin/*` trả 401 khi thiếu token.

---

## Phase 4 — BE Catalog

- [ ] Danh sách sản phẩm: lọc theo nhiều category slug, khoảng giá, size, màu; tìm theo tên; sắp xếp; phân trang
- [ ] Chi tiết sản phẩm theo slug, kèm biến thể, ảnh, danh sách category
- [ ] API category gom theo group, category nổi bật, sản phẩm theo mùa hiện tại (category SEASON ứng với tháng hiện tại)
- [ ] Admin CRUD category và product; gán/bỏ nhiều category cho một product
- [ ] Xoá category chỉ xoá liên kết, không xoá product

> **Xong khi:** lọc kết hợp nhiều category trả đúng, có unit test cho service lọc.

---

## Phase 5 — BE Upload ảnh bằng presigned URL

- [ ] `POST /admin/uploads/presign` nhận filename, contentType, size → kiểm tra loại (jpeg/png/webp) và dung lượng (≤ 5 MB) → trả `uploadUrl` (PUT, hết hạn 5 phút), `key` (`products/<uuid>.<ext>`), `publicUrl`
- [ ] Ký kèm `Content-Type` để client không upload sai loại file
- [ ] `POST /admin/products/:id/images` nhận key: kiểm tra object tồn tại trên R2 (HeadObject) rồi mới tạo `ProductImage`
- [ ] Sắp xếp lại thứ tự ảnh, xoá ảnh thì xoá cả object trên R2
- [ ] Job hằng ngày dọn object không gắn với sản phẩm nào sau 24 giờ

> **Xong khi:** upload từ trình duyệt thẳng lên R2 thành công, BE không nhận file trực tiếp.

---

## Phase 6 — BE Guest checkout

- [ ] `POST /orders` public: items (variantId, quantity), thông tin khách (họ tên, email, SĐT bắt buộc, kiểm tra định dạng SĐT Việt Nam), địa chỉ giao hàng, ghi chú
- [ ] Tính lại giá từ DB (không tin giá client gửi), phí ship lấy từ `settings` (`shipping.fee`, mặc định 20.000 ₫), miễn phí khi vượt `shipping.free_from` nếu có đặt
- [ ] Trừ kho bằng một D1 batch (atomic), bảng biến thể có ràng buộc `CHECK (stock >= 0)` để thiếu hàng thì cả batch rollback; snapshot giá vào OrderItem, sinh mã đơn, status `PENDING_CONFIRMATION`
- [ ] `POST /cart/validate`: kiểm tra giá và tồn kho mới nhất cho giỏ lưu ở trình duyệt
- [ ] Chống spam: throttler theo IP, giới hạn số lượng mỗi dòng, trường honeypot
- [ ] Sau khi commit đơn: ghi `EmailLog` cho email xác nhận gửi khách và email báo đơn mới cho team; gửi lỗi không làm hỏng đơn

> **Xong khi:** có test cho hết hàng, giá client bị sửa, và 2 người đặt cùng lúc biến thể cuối cùng.

---

## Phase 7 — BE Quản lý đơn hàng

- [ ] Admin: danh sách đơn lọc theo status, ngày, tìm theo mã/SĐT/email; chi tiết đơn; ghi chú nội bộ
- [ ] `OrderStatusService.transition()` là nơi duy nhất đổi status, kiểm tra luồng hợp lệ, ghi `OrderStatusHistory`
- [ ] Huỷ đơn thì hoàn kho
- [ ] Phát event `order.status_changed` (`@nestjs/event-emitter`) để email và tích hợp sau này lắng nghe
- [ ] Interface `DeliveryProvider` (createShipment, cancelShipment, getTracking, handleWebhook) với `ManualDeliveryProvider` mặc định
- [ ] Thống kê cơ bản: số đơn theo status, doanh thu đơn COMPLETED theo ngày

Luồng status hợp lệ:

| Từ | Được chuyển sang |
| --- | --- |
| PENDING_CONFIRMATION | CONFIRMED, CANCELLED |
| CONFIRMED | PROCESSING, CANCELLED |
| PROCESSING | SHIPPING, CANCELLED |
| SHIPPING | COMPLETED, CANCELLED |
| COMPLETED | (kết thúc) |
| CANCELLED | (kết thúc) |

> **Xong khi:** chuyển status sai luồng bị từ chối, mỗi lần đổi đều có lịch sử ai đổi và lúc nào.

---

## Phase 8 — BE Email

- [ ] `MailModule` (nodemailer SMTP), template tiếng Việt cho 3 loại email
- [ ] Email xác nhận đơn gửi khách: mã đơn, sản phẩm, tổng tiền, địa chỉ, lời nhắn "team sẽ liên hệ xác nhận"
- [ ] Email báo đơn mới cho team (`ADMIN_NOTIFY_EMAIL`)
- [ ] Email xin feedback: lắng nghe `order.status_changed`, khi sang COMPLETED thì tạo `EmailLog` type `FEEDBACK_REQUEST`; nhờ unique (orderId, type), insert thất bại nghĩa là đã gửi rồi → bỏ qua
- [ ] Gửi nền có retry (tối đa 3 lần, backoff), cập nhật status trong `EmailLog`

> **Xong khi:** đánh dấu COMPLETED hai lần (hoặc bấm đôi) chỉ ra đúng 1 email feedback trong Mailpit.

---

## Phase 9 — FE nền tảng

- [x] Design system: màu chủ đạo, font hỗ trợ tiếng Việt, component Button, Input, Select, Badge, Modal, Toast, Skeleton
- [x] Layout: header (menu dựng từ category theo group, tìm kiếm, icon giỏ hàng), footer, responsive mobile
- [x] API client: fetch wrapper, type chung cho response; token chỉ dùng trong khu admin
- [x] Giỏ hàng lưu `localStorage` (Zustand persist), không cần đăng nhập
- [x] Hàm định dạng tiền VND

> **Xong khi:** layout hiển thị tốt trên mobile và desktop, menu category lấy từ API.
>
> Menu đọc từ `GET /categories`; endpoint đó có từ Phase 4, trước đó header hiện các link tĩnh thay vì sập.

---

## Phase 10 — FE Storefront (URL tiếng Anh)

| Route | Nội dung |
| --- | --- |
| `/` | Banner mùa hiện tại, khối theo từng mùa, sản phẩm nổi bật, quà theo dịp sắp tới |
| `/categories/[slug]` | Sản phẩm của một category, bộ lọc (drawer trên mobile) |
| `/gifts` | Category nhóm OCCASION và sản phẩm làm quà |
| `/products/[slug]` | Gallery, chọn size/màu, báo hết hàng theo biến thể, sản phẩm liên quan |
| `/search` | Kết quả tìm kiếm có bộ lọc |

- [ ] Dựng các trang storefront theo bảng trên, filter đồng bộ lên URL
- [ ] Đổi hết route tiếng Việt cũ (`/qua-tang`, `/san-pham`, `/mua`, `/danh-muc`...) sang tiếng Anh
- [ ] Server Components + metadata cho SEO
- [ ] Landing page nhận feedback (`FEEDBACK_URL` trỏ vào đây thay vì form ngoài)
- [ ] Xoá trang giữ chỗ `app/search/page.tsx` và `components/layout/coming-soon.tsx`

> **Xong khi:** không còn route tiếng Việt, chọn biến thể hết hàng thì nút thêm giỏ bị khoá.

---

## Phase 11 — FE Giỏ hàng và Guest checkout

- [ ] `/cart`: sửa số lượng, xoá, gọi `/cart/validate` để cập nhật giá và tồn kho mới nhất (thay trang giữ chỗ hiện tại)
- [ ] `/checkout`: họ tên, email, SĐT (bắt buộc, kiểm tra định dạng), tỉnh/thành, xã/phường, địa chỉ, ghi chú — đều nhập tự do; hiện phí ship và tổng tiền
- [ ] Báo lỗi rõ khi hết hàng lúc đặt, chặn bấm gửi hai lần
- [ ] `/order-success/[code]`: mã đơn, tóm tắt, lời nhắn "chúng tôi sẽ gọi xác nhận trong X giờ", xoá giỏ

> **Xong khi:** đặt được đơn end-to-end không cần tài khoản, email xác nhận về Mailpit.

---

## Phase 12 — FE Admin (`/admin`)

- [ ] `/admin/login`, middleware bảo vệ toàn bộ `/admin`
- [ ] Dashboard: số đơn theo status, doanh thu theo ngày
- [ ] Trang cài đặt: sửa phí ship và ngưỡng miễn phí; quản lý danh sách size và màu
- [ ] Quản lý category theo group; quản lý product, biến thể, gán nhiều category
- [ ] Upload ảnh: lấy presigned URL → PUT thẳng lên R2 có thanh tiến trình → gắn vào product; kéo thả đổi thứ tự
- [ ] Đơn hàng: danh sách + bộ lọc, chi tiết, nút đổi status chỉ hiện các bước hợp lệ, xác nhận trước khi huỷ, timeline lịch sử, ghi chú nội bộ, trạng thái email đã gửi

> **Xong khi:** admin tạo product kèm ảnh và nó hiện ngoài storefront; đổi đơn sang COMPLETED thì khách nhận email feedback.

---

## Phase 13 — Hoàn thiện và Deploy

- [ ] E2E Playwright: xem sản phẩm → thêm giỏ → checkout → admin xác nhận → COMPLETED → kiểm tra email feedback
- [ ] SEO: sitemap, robots, Open Graph, structured data cho sản phẩm
- [ ] `next/image` khai báo `remotePatterns` cho domain R2, Lighthouse ≥ 90 trên mobile
- [ ] Dockerfile multi-stage build 1 image chứa cả BE và FE, **đặt trong repo `socks-backend`**; FE lấy từ repo riêng (CI build thành artifact rồi copy vào, hoặc build-arg là commit của FE); entrypoint chạy migration trước rồi mới start 2 process
- [ ] Sao lưu DB: dùng D1 Time Travel để khôi phục theo thời điểm, thêm job export định kỳ (`wrangler d1 export`) lên R2; deploy gateway bằng `wrangler deploy`; viết hướng dẫn restore
- [ ] Cloudflare: DNS, proxy + SSL Full (strict), custom domain cho bucket ảnh
- [ ] README hướng dẫn chạy local và deploy

> **Xong khi:** site chạy trên domain thật, luồng E2E pass, restore thử DB thành công.

---

## Sau MVP

Để dành cho bản sau: thanh toán online (VNPay/MoMo), tài khoản khách, đánh giá
sản phẩm, mã giảm giá, hộp quà tự chọn, tích hợp GHN/GHTK qua `DeliveryProvider`.

---

## Phụ lục — phác thảo Drizzle schema

Dành cho Phase 2, viết vào `backend/src/database/schema/`. **Đây là khai báo để
Drizzle truy vấn có type, không phải nguồn sinh migration** — bảng thật do các file
trong `src/database/migrations/` tạo ra, viết tay, mỗi bảng một file.
Drizzle đặt `casing: 'snake_case'` nên cột trong DB là snake_case.

```ts
import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const id = () => text().primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`);

export const adminUsers = sqliteTable('admin_users', {
  id: id(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  createdAt: createdAt(),
});

// group: SEASON | TYPE | AUDIENCE | OCCASION — không có bảng Season riêng.
export const categories = sqliteTable(
  'categories',
  {
    id: id(),
    name: text().notNull(),
    slug: text().notNull(),
    group: text().notNull(),
    description: text(),
    imageUrl: text(),
    sortOrder: integer().notNull().default(0),
    isActive: integer({ mode: 'boolean' }).notNull().default(true),
    isFeatured: integer({ mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex('categories_slug_idx').on(table.slug), index('categories_group_idx').on(table.group)],
);

export const products = sqliteTable(
  'products',
  {
    id: id(),
    name: text().notNull(),
    slug: text().notNull(),
    description: text(),
    basePrice: integer().notNull(), // VND
    isActive: integer({ mode: 'boolean' }).notNull().default(true),
    isFeatured: integer({ mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex('products_slug_idx').on(table.slug), index('products_active_idx').on(table.isActive)],
);

export const productCategories = sqliteTable(
  'product_categories',
  {
    productId: text().notNull().references(() => products.id, { onDelete: 'cascade' }),
    categoryId: text().notNull().references(() => categories.id, { onDelete: 'cascade' }),
    sortOrder: integer().notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index('product_categories_category_idx').on(table.categoryId),
  ],
);

// Admin quản lý danh sách size và màu ở đây thay vì hard-code trong source.
export const variantOptions = sqliteTable(
  'variant_options',
  {
    id: id(),
    kind: text().notNull(), // SIZE | COLOR
    value: text().notNull(), // dùng trong URL filter: "m", "navy"
    label: text().notNull(), // hiện cho khách: "Size M", "Xanh navy"
    hexColor: text(), // chỉ dùng khi kind = COLOR, để FE vẽ ô màu
    sortOrder: integer().notNull().default(0),
    isActive: integer({ mode: 'boolean' }).notNull().default(true),
  },
  (table) => [uniqueIndex('variant_options_kind_value_idx').on(table.kind, table.value)],
);

// Tham số admin sửa được mà không cần deploy: shipping.fee, shipping.free_from...
export const settings = sqliteTable('settings', {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: createdAt(),
});

export const productVariants = sqliteTable(
  'product_variants',
  {
    id: id(),
    productId: text().notNull().references(() => products.id, { onDelete: 'cascade' }),
    sku: text().notNull(),
    sizeId: text().notNull().references(() => variantOptions.id),
    colorId: text().notNull().references(() => variantOptions.id),
    price: integer().notNull(),
    stock: integer().notNull().default(0),
    isActive: integer({ mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    uniqueIndex('product_variants_sku_idx').on(table.sku),
    index('product_variants_product_idx').on(table.productId),
    // D1 không có transaction tương tác: ràng buộc này là thứ làm batch trừ kho rollback khi hết hàng.
    check('product_variants_stock_non_negative', sql`${table.stock} >= 0`),
  ],
);

export const productImages = sqliteTable(
  'product_images',
  {
    id: id(),
    productId: text().notNull().references(() => products.id, { onDelete: 'cascade' }),
    r2Key: text().notNull(),
    url: text().notNull(),
    alt: text(),
    sortOrder: integer().notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index('product_images_product_idx').on(table.productId)],
);

export const orders = sqliteTable(
  'orders',
  {
    id: id(),
    code: text().notNull(), // SK-20261022-0001
    customerName: text().notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    // Hai cấp theo cải cách hành chính 2025: tỉnh/thành -> xã/phường.
    province: text().notNull(),
    ward: text().notNull(),
    street: text().notNull(),
    note: text(),
    subtotal: integer().notNull(),
    shippingFee: integer().notNull().default(0),
    total: integer().notNull(),
    status: text().notNull().default('PENDING_CONFIRMATION'),
    internalNote: text(),
    createdAt: createdAt(),
    updatedAt: createdAt(),
  },
  (table) => [
    uniqueIndex('orders_code_idx').on(table.code),
    index('orders_status_idx').on(table.status),
    index('orders_created_at_idx').on(table.createdAt),
    index('orders_phone_idx').on(table.phone),
  ],
);

// Snapshot: tên và giá giữ nguyên kể cả khi sản phẩm đổi sau này.
export const orderItems = sqliteTable(
  'order_items',
  {
    id: id(),
    orderId: text().notNull().references(() => orders.id, { onDelete: 'cascade' }),
    variantId: text().references(() => productVariants.id, { onDelete: 'set null' }),
    productName: text().notNull(),
    variantLabel: text().notNull(),
    sku: text().notNull(),
    unitPrice: integer().notNull(),
    quantity: integer().notNull(),
    lineTotal: integer().notNull(),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)],
);

export const orderStatusHistory = sqliteTable(
  'order_status_history',
  {
    id: id(),
    orderId: text().notNull().references(() => orders.id, { onDelete: 'cascade' }),
    fromStatus: text(),
    toStatus: text().notNull(),
    note: text(),
    changedBy: text().references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (table) => [index('order_status_history_order_idx').on(table.orderId)],
);

// Chưa dùng trong MVP, có sẵn để Phase sau cắm GHN/GHTK mà không phải migrate lại.
export const shipments = sqliteTable(
  'shipments',
  {
    id: id(),
    orderId: text().notNull().references(() => orders.id, { onDelete: 'cascade' }),
    provider: text().notNull().default('MANUAL'),
    trackingCode: text(),
    status: text(),
    fee: integer().notNull().default(0),
    rawPayload: text({ mode: 'json' }),
    createdAt: createdAt(),
  },
  (table) => [index('shipments_order_idx').on(table.orderId)],
);

export const emailLogs = sqliteTable(
  'email_logs',
  {
    id: id(),
    orderId: text().notNull().references(() => orders.id, { onDelete: 'cascade' }),
    type: text().notNull(), // ORDER_CONFIRMATION | FEEDBACK_REQUEST | ADMIN_NEW_ORDER
    status: text().notNull().default('PENDING'),
    attempts: integer().notNull().default(0),
    error: text(),
    sentAt: integer({ mode: 'timestamp' }),
    createdAt: createdAt(),
  },
  (table) => [
    // Khoá chống gửi trùng: insert hỏng nghĩa là email loại này đã gửi cho đơn đó.
    uniqueIndex('email_logs_order_type_idx').on(table.orderId, table.type),
  ],
);
```

### Quyết định đã chốt (2026-10-23)

| # | Vấn đề | Chốt |
| --- | --- | --- |
| 2 | Nhập địa chỉ | Nhập tự do, không ép chọn từ danh sách hành chính |
| 3 | Size, màu, thuộc tính tất | Admin tự quyết, không hard-code trong source |
| 4 | SKU | Tự sinh từ slug + size + màu, cho phép admin sửa đè |
| 5 | Mã đơn | `SK-YYYYMMDD-XXXX` với 4 ký tự ngẫu nhiên + unique, trùng thì sinh lại |
| 6 | Phí ship | Một mức phẳng, mặc định 20.000 ₫, admin sửa được trong trang quản trị. Không tính theo khoảng cách |
| 7 | Feedback | Làm landing page trên site, không dùng form ngoài |
| 8 | Repo | Giữ hai repo riêng biệt, không gộp monorepo |
| 9 | Địa chỉ | Hai cấp: tỉnh/thành → xã/phường. Bỏ cấp quận/huyện |
| 10 | Miễn phí ship | Đơn từ 300.000 ₫ trở lên được miễn phí giao hàng |
| 11 | Tài liệu chung | `CLAUDE.md` và `PLAN.md` nằm trong repo `socks-backend` |
| 12 | Dockerfile | Đặt trong repo `socks-backend`, build FE từ nguồn ngoài |

Ảnh hưởng tới schema Phase 2:

- **Size và màu** do admin quyết nhưng vẫn phải lọc được ở Phase 4, nên lưu
  thành bảng `variant_options` (admin thêm/sửa/xoá) thay vì enum trong code hay
  text tự do. Text tự do sẽ làm bộ lọc tách "Xanh navy" và "xanh Navy" thành
  hai giá trị khác nhau.
- **Phí ship** cần bảng `settings` (key/value) để admin sửa mà không phải deploy:
  `shipping.fee` (mặc định 20000) và `shipping.free_from` nếu có ngưỡng miễn phí.
  Không cần geocode hay tính khoảng cách.
- **Địa chỉ** bỏ cột `district`; đơn hàng lưu `province`, `ward`, `street`.
- **Feedback landing page** thêm một task vào Phase 10 và đổi `FEEDBACK_URL`
  thành đường dẫn nội bộ.

### Còn mở

Không còn điểm nào chặn Phase 2.

### Về `@longphan93/nestjs-migration`

Đã đọc source (commit `8d092ed`). Thư viện là lớp bọc API fluent
(`createTable`, `column().string().nullable()`) lên trên QueryRunner của TypeORM
hoặc Sequelize. Ba trở ngại khi dùng cho dự án này:

1. **Không có executor nào chạy được trên D1.** `TypeOrmExecutor` cần một
   `QueryRunner` của TypeORM, `SequelizeExecutor` cần instance Sequelize. D1 chỉ
   truy cập được qua HTTPS tới Worker — không socket TCP, không file SQLite —
   nên cả hai ORM đều không kết nối tới được.
2. **Package chưa cài được.** `package.json` thiếu `main`, `types`, `exports`,
   `files`; 7 file import theo đường tuyệt đối `src/...` (chỉ phân giải được nhờ
   `baseUrl` lúc biên dịch, chạy từ `node_modules` sẽ ném lỗi không tìm thấy
   module).
3. **Tầng driver chỉ map kiểu cột.** `SqliteDriver.mapColumnType()` chỉ đổi
   `ColumnTypeEnum` sang tên kiểu SQLite; phần sinh câu lệnh DDL thật là do
   TypeORM/Sequelize làm. Thư viện cũng không có runner theo dõi migration nào đã
   chạy — phần đó vốn do ORM lo.

Muốn dùng thì phải: sửa package cho cài được, tự viết `D1GatewayExecutor`
implement 8 phương thức của `BaseExecutor` kèm toàn bộ phần sinh DDL SQLite, và
viết thêm runner ghi nhận migration đã chạy. Thêm nữa, SQLite hạn chế `ALTER
TABLE` rất nặng (không thêm được khoá ngoại hay khoá chính sau khi tạo bảng),
nên `updateTable`, `createForeignKey`, `createPrimary` sẽ không chạy đúng trên
D1 dù có executor.

Hiện Phase 1 đang dùng drizzle-kit sinh SQL + `wrangler d1 migrations apply`,
đã chạy thông từ đầu đến cuối. Đề xuất giữ nguyên cho dự án này.
