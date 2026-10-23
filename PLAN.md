# PLAN.md

Chỉ sang phase mới khi đạt dòng **Xong khi**. Tick `[x]` ngay sau khi task chạy
được và đã chạy lint/test.

Các phase bên dưới xếp theo **số**, nhưng thứ tự **làm** thì theo bảng này.
Phase 12 (trang admin) đã được tách làm ba lát, mỗi lát ra ngay sau phần backend
nó cần — để có trang quản trị dùng được sớm thay vì đợi tới cuối dự án.

| # | Phase | Trạng thái |
| --- | --- | --- |
| 1 | Phase 0 — Nền tảng chung | xong (còn vài việc trên Cloudflare) |
| 2 | Phase 1 — BE core và migration | xong |
| 3 | Phase 9 — FE nền tảng | xong |
| 4 | **Phase 2 — Database schema MVP** | ← tiếp theo |
| 5 | Phase 3 — BE Admin auth | |
| 6 | Phase 4 — BE Catalog | |
| 7 | **Phase 12a — FE Admin: đăng nhập + quản lý catalog** | **admin dùng được từ đây** |
| 8 | Phase 5 — BE Upload ảnh | |
| 9 | **Phase 12b — FE Admin: upload ảnh sản phẩm** | |
| 10 | Phase 6 — BE Guest checkout | |
| 11 | Phase 7 — BE Quản lý đơn hàng | |
| 12 | Phase 8 — BE Email | |
| 13 | **Phase 12c — FE Admin: đơn hàng, dashboard, cài đặt** | |
| 14 | **Phase 9b — FE Thành phần storefront + i18n** | |
| 15 | Phase 10 — FE Storefront | |
| 16 | Phase 11 — FE Giỏ hàng và Checkout | |
| 17 | Phase 13 — Hoàn thiện và Deploy | |

Vì sao admin đi trước storefront: có admin thì nhập được category và sản phẩm
thật, nên tới lượt dựng storefront đã có dữ liệu thật để nhìn, không phải bịa
dữ liệu mẫu rồi sửa lại sau.

---

## Chuẩn giao diện tham chiếu

Site mẫu: [bonnemaison.fr](https://www.bonnemaison.fr/) — hãng tất Pháp, Shopify.
Đã đọc cấu trúc trang chủ ngày 2026-10-23. Những gì lấy về làm chuẩn:

**Trang chủ là một bài biên tập, không phải lưới sản phẩm.** Thứ tự khối của họ:

```
thanh thông báo
header + mega menu
hero toàn chiều rộng = bộ sưu tập đang chạy
carousel sản phẩm
banner biên tập (một chủ đề, ảnh lớn + tên)
carousel sản phẩm
banner biên tập
khối cam kết (chất liệu, sản xuất tại Pháp)
đăng ký nhận tin
footer
```

Không có khối "sản phẩm mới nhất" kiểu liệt kê. Mỗi carousel đứng sau một banner
giới thiệu chủ đề, nên người xem luôn biết đang nhìn bộ nào.

**Thẻ sản phẩm có chọn size ngay trên thẻ** (hiện 36 / 38 / 39 / 41 và nút thêm
nhanh), không bắt vào trang chi tiết mới mua được.

**Phân loại hai trục.** Kiểu dáng (`chaussettes`, `mi-bas`, `socquettes`) và bộ
sưu tập theo chủ đề (`dimanche`, `colombage`, `conte-indien`, `les-unies`...).
Tên sản phẩm đặt theo hoạ tiết chứ không phải mã: "Chaussettes Le Tapis",
"Mi-Bas Papillons de Nuit".

**Footer là một trung tâm tin cậy**, không phải bãi link:
- 4 cam kết: chất lượng · thanh toán an toàn · miễn phí ship từ mức X · đổi trả
- Liên hệ: email, địa chỉ cửa hàng, giờ mở cửa
- Ba cột: thương hiệu · hậu mãi · pháp lý
- Dãy logo phương thức thanh toán

**Có trang tra cứu đơn hàng** (`/pages/suivi-de-commande`) vì khách không cần tài
khoản vẫn phải theo dõi được đơn. Dự án này cũng không có tài khoản khách nên
thiếu trang đó là thiếu hẳn một đường đi.

**Trang hỗ trợ tách riêng**: bảng size, hướng dẫn bảo quản, giao hàng, đổi trả.
Với mặt hàng tất thì bảng size là trang được mở nhiều, không phải phụ lục.

### Chỗ KHÔNG bê nguyên

- Họ không có trục "dịp tặng quà" — mà `OCCASION` lại đúng là nửa tên dự án này.
  Giữ nguyên 4 nhóm `SEASON / TYPE / AUDIENCE / OCCASION`, **thêm nhóm thứ năm
  `COLLECTION`** cho bộ sưu tập theo chủ đề. `group` lưu dạng text nên thêm nhóm
  không phải đổi schema.
- Họ bán thẻ quà tặng và sách; MVP này không có.

---

## Đa ngôn ngữ

Làm từ đầu, không phải việc bổ sung sau. Hai ngôn ngữ: **tiếng Việt (mặc định)**
và **tiếng Anh**. Tiền luôn là VND ở cả hai — không quy đổi tiền tệ trong MVP.

**Đường dẫn.** `next-intl` với `localePrefix: 'as-needed'`: tiếng Việt giữ
nguyên `/products/[slug]`, tiếng Anh thêm tiền tố `/en/products/[slug]`. Nhờ vậy
mọi URL đã chốt không đổi, và trang tiếng Anh vẫn có URL riêng để index.

**Chuỗi giao diện.** `apps/frontend/messages/{vi,en}.json`, gọi qua `t('key')`.
Không hardcode chuỗi trong component — kể cả chuỗi tiếng Việt.

**Lỗi từ backend là i18n key, không phải câu.** Giống `ok-danang-ecosystem`:
`throw new BadRequestException('order.out_of_stock')`, key nằm ở
`apps/backend/src/i18n/{vi,en}/<domain>.json`, filter dịch theo header
`Accept-Language`. **Thiếu key ở một ngôn ngữ là client nhận được chuỗi key thô**,
nên thêm key phải thêm đủ cả hai file.

**Nội dung trong DB dịch bằng cột JSON.** Tên và mô tả category, product,
nhãn size/màu lưu `{"vi": "...", "en": "..."}` thay vì hai cột riêng — thêm ngôn
ngữ sau này không phải migrate. Đây cũng là cách `ok-danang-ecosystem` đang làm.
`slug` chỉ có **một** bản dùng chung cho mọi ngôn ngữ, vì URL đã quy ước tiếng Anh.

Thiếu bản dịch tiếng Anh thì rơi về tiếng Việt, không hiện ô trống.

### Việc phải làm lại ở Phase 9

Phase 9 dựng xong trước khi có quyết định này nên **41 chuỗi tiếng Việt đang
hardcode** trong `app/`, `components/`. Phase 9b phải bóc hết ra file messages —
đây là nợ kỹ thuật có thật, không phải việc phát sinh.

## Shop thật và điều nó quyết định

Shop đang bán trên Facebook ([Tất Vớ - Quà Tặng Đà Nẵng](https://www.facebook.com/tatvoquatangdanang)),
chuyển sang web để chuyên nghiệp hơn. **Bán online hoàn toàn**, không có cửa hàng
cho khách tới xem.

| Thực tế | Kéo theo |
| --- | --- |
| Giá từ **25.000 ₫ tới ~300.000 ₫** (tất lẻ → quần tất) | Phí ship phẳng 20k là **sai**: với đôi 25k thì phí bằng 80% giá hàng. Phải có nhiều hình thức giao, và đẩy mạnh mua combo |
| Mua lẻ hoặc mua set tuỳ ý | Không làm SKU combo riêng; giỏ tính theo số lượng, có gợi ý "mua thêm X để miễn ship" |
| **Bốn hình thức nhận hàng**: ghé nhận · hoả tốc · trong ngày nội thành Đà Nẵng · COD toàn quốc | Không phải một mức phí. Cần bảng `shipping_methods` admin tự quản lý |
| Khách chốt đơn qua **Facebook → Zalo → gọi điện**, muốn thêm Instagram | Nút Zalo phải nổi nhất, không giấu trong footer. Mobile có thanh liên hệ cố định |
| Khách tới web **từ link trong post và tin nhắn**, không từ Google | Giữ nhịp trang đẹp của site tham chiếu nhưng đưa hàng sản phẩm lên trước chuỗi banner |

### Lấy gì từ Bonne Maison

Lấy **chất lượng và cách hành xử của giao diện**, không sao chép bố cục.

**Chất lượng trình bày.** Khoảng trắng rộng, lưới chặt, ảnh sản phẩm là nhân vật
chính chứ không phải khung viền và nhãn giảm giá. Typography kỷ luật: ít cỡ chữ,
ít màu, không chữ nhấp nháy. Đây mới là thứ tạo cảm giác "web chuyên nghiệp" —
nó đến từ sự tiết chế, không đến từ việc thêm hiệu ứng.

**Cách tương tác.** Chọn size ngay trên thẻ sản phẩm · mega menu có ảnh bộ sưu
tập · carousel cuộn mượt · giỏ hàng mở dạng drawer thay vì chuyển trang · modal
bảng size gọi được từ nhiều chỗ · header dính khi cuộn · ảnh tỉ lệ cố định để
không giật layout.

**Nhịp trang.** Hero ảnh lớn → sản phẩm → khối chủ đề → cam kết → footer. Mỗi
khối làm một việc, không nhồi.

**Footer là trung tâm tin cậy** và **trang hỗ trợ tách riêng** (bảng size, bảo
quản, giao hàng, đổi trả, tra cứu đơn).

### Điều chỉnh cho hoàn cảnh của shop

Giữ nguyên tinh thần trên, chỉnh bốn chỗ — vì khách tới từ link Facebook/Zalo
chứ không phải từ Google, và tới với câu hỏi "giá bao nhiêu, ship thế nào":

| Bonne Maison | Ở đây |
| --- | --- |
| Hero chiếm trọn màn hình, kể chuyện bộ sưu tập | Hero vẫn là ảnh lớn đẹp nhưng **thấp hơn** (~70% màn hình) và có nút rõ ràng, để hàng sản phẩm đầu tiên ló lên khi cuộn nhẹ |
| 3–4 khối banner biên tập xen carousel | **1–2 khối** là đủ, đặt sau hàng sản phẩm bán chạy |
| Chỉ có form liên hệ và email | Thêm **Zalo, gọi điện, Facebook, Instagram**; mobile có thanh cố định đáy màn hình |
| Đăng ký nhận tin qua email | Người Việt theo dõi page và Zalo nhiều hơn — ưu tiên nút theo dõi, email là phụ |

Thêm tín hiệu mà site Pháp không cần: **ship trong ngày Đà Nẵng · COD toàn quốc
· miễn ship từ 300k** ở thanh thông báo, và thanh tiến trình "mua thêm X để miễn
phí giao hàng" trong giỏ.

### Bố cục trang chủ

```
thanh thông báo: ship trong ngày Đà Nẵng · COD toàn quốc · miễn ship từ 300k
header dính: logo · mega menu · tìm kiếm · giỏ (mở drawer)
hero ảnh lớn ~70vh: một câu + nút "Xem sản phẩm"
lưới sản phẩm bán chạy            ← có giá, chọn size ngay trên thẻ
khối quà tặng theo dịp sắp tới
banner bộ sưu tập  →  carousel sản phẩm của bộ đó
"Vì sao mua ở đây": ship trong ngày DN · COD toàn quốc · đổi trả · gói quà
TrustBar + kênh liên hệ (Zalo · Facebook · Instagram · gọi)
footer
[mobile] thanh cố định đáy: Zalo · Gọi · Giỏ hàng
```

So với Bonne Maison: vẫn giữ hero ảnh lớn và khối bộ sưu tập, chỉ **đổi thứ tự**
để hàng sản phẩm lên trước chuỗi banner, và **giảm số banner** từ 3–4 xuống 1–2.

### Nghiệp vụ theo thói quen trong nước

- **Dịp tặng quà là trục phân loại chính** (`OCCASION`): Tết, Valentine, 8/3,
  20/10, 20/11, Noel, sinh nhật.
- **Số điện thoại là danh tính của đơn**, không phải email. Tra cứu đơn bằng mã
  + số điện thoại; team gọi xác nhận trước khi giao.
- **COD mặc định**, không thanh toán online trong MVP.
- **Zalo là kênh chốt đơn chính** — nút Zalo ở header, trang sản phẩm, thanh cố
  định trên mobile; không chỉ nằm trong footer.
- **Gói quà và thiệp viết tay miễn phí** nêu rõ ở trang sản phẩm nhóm `OCCASION`.
- Địa chỉ hai cấp tỉnh/thành → xã/phường theo cải cách 2025.

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
> Trạng thái: 9/9 task xong và đã chạy thử. `/api/v1/health` trả
> `{"database":"ok"}`, Swagger 200, migrate trên DB trống chạy sạch và tạo bảng
> ghi sổ `migrations`.
>
> **Nửa còn lại của tiêu chí chưa đạt:** "tự tạo đủ bảng" cần có file migration,
> mà `src/database/migrations/` hiện mới có README. Bảng nghiệp vụ do Phase 2
> khai báo — tiêu chí này chỉ đạt khi Phase 2 xong.

---

## Phase 2 — Database schema MVP

- [ ] Xoá model và code liên quan: Season, GiftBox, GiftBoxItem, GiftOccasion, WrappingOption, Cart, CartItem, Coupon, Payment, Address, Review, tài khoản khách
- [ ] `AdminUser`: email, passwordHash, name
- [ ] `Category`: name và description là **cột JSON `{vi, en}`**; slug (một bản dùng chung), group (`SEASON`/`TYPE`/`AUDIENCE`/`OCCASION`/`COLLECTION`), imageUrl, sortOrder, isActive, isFeatured
- [ ] `ProductCategory`: bảng nối many-to-many tường minh (productId, categoryId, sortOrder)
- [ ] `Product` (name, description là cột JSON `{vi, en}`), `ProductVariant` (size, màu, SKU, giá, tồn kho), `ProductImage` (r2Key, url, alt JSON `{vi, en}`, sortOrder)
- [ ] `VariantOption`: danh sách size và màu do admin quản lý (kind, value, label JSON `{vi, en}`, hexColor, sortOrder) — biến thể tham chiếu vào đây để bộ lọc Phase 4 không bị tách giá trị
- [ ] `ShippingMethod`: code, name JSON `{vi, en}`, description JSON, fee, freeFrom (ngưỡng miễn phí riêng từng hình thức, null là không có), areaNote (vd "nội thành Đà Nẵng"), estimatedTime, isPickup, sortOrder, isActive — bốn bản ghi seed: ghé nhận · hoả tốc Đà Nẵng · trong ngày Đà Nẵng · COD toàn quốc
- [ ] `Setting`: key/value cho kênh liên hệ (`contact.zalo`, `contact.phone`, `contact.facebook`, `contact.instagram`) và các tham số admin sửa được mà không cần deploy
- [ ] `Order`: code (`SK-YYYYMMDD-XXXX`), customerName, email, phone, province, ward, street, note, subtotal, shippingFee, total, status, internalNote
- [ ] `OrderItem`: snapshot tên, biến thể, đơn giá, số lượng
- [ ] `OrderStatusHistory`: fromStatus, toStatus, note, changedBy, createdAt
- [ ] `Shipment` (chuẩn bị cho đơn vị vận chuyển): orderId, provider (`MANUAL` mặc định), trackingCode, status, fee, rawPayload
- [ ] `EmailLog`: orderId, type (`ORDER_CONFIRMATION`/`FEEDBACK_REQUEST`/`ADMIN_NEW_ORDER`), status, attempts, error; **unique (orderId, type)** để chống gửi trùng
- [ ] Quy ước: tiền `integer` (VND), status/group lưu `text` + hằng số TS; index cho slug, sku, status, createdAt. Mỗi bảng một file migration
- [ ] Seed: category đủ 4 nhóm (5 mùa là category nhóm SEASON), ~30 sản phẩm gán nhiều category, 1 admin từ env, size/màu mặc định, 4 hình thức giao hàng, kênh liên hệ

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
- [ ] Mọi response có nội dung dịch được đều **giải theo `Accept-Language`** rồi mới trả: client nhận chuỗi đã chọn ngôn ngữ, không nhận cả object `{vi, en}`. Thiếu bản dịch thì rơi về tiếng Việt
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
- [ ] Khách **chọn hình thức nhận hàng** từ `shipping_methods`; đơn lưu `shippingMethodId` và phí đã chốt
- [ ] Tính lại giá từ DB (không tin giá client gửi); phí ship lấy từ hình thức khách chọn, về 0 khi tổng hàng vượt `freeFrom` của hình thức đó
- [ ] Hình thức `isPickup` thì không bắt nhập địa chỉ giao
- [ ] Trừ kho bằng một D1 batch (atomic), bảng biến thể có ràng buộc `CHECK (stock >= 0)` để thiếu hàng thì cả batch rollback; snapshot giá vào OrderItem, sinh mã đơn, status `PENDING_CONFIRMATION`
- [ ] `POST /cart/validate`: kiểm tra giá và tồn kho mới nhất cho giỏ lưu ở trình duyệt
- [ ] Lưu `locale` của khách lúc đặt đơn, để email và trang tra cứu dùng đúng ngôn ngữ
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

- [ ] `MailModule` (nodemailer SMTP), template cho 3 loại email, **mỗi loại có bản vi và en**, chọn theo ngôn ngữ khách dùng lúc đặt (lưu `locale` trên đơn)
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

## Phase 9b — FE Thành phần storefront

Phase 9 đã có primitive (Button, Input, Select, Badge, Modal, Toast, Skeleton).
Đây là các thành phần ghép, dựng trước khi lắp trang ở Phase 10 để mỗi trang
không tự chế một kiểu.

- [ ] Cài `next-intl`, `localePrefix: 'as-needed'` (vi không tiền tố, en là `/en/...`), middleware chọn ngôn ngữ
- [ ] `messages/vi.json` và `messages/en.json`; **bóc 41 chuỗi tiếng Việt đang hardcode** ở `app/` và `components/` ra file messages
- [ ] Nút đổi ngôn ngữ trên header, nhớ lựa chọn bằng cookie
- [ ] `formatVnd` và `formatDate` nhận locale; tiền vẫn là VND ở cả hai ngôn ngữ
- [ ] `ProductCard`: ảnh tỉ lệ cố định, tên sản phẩm, giá, **chọn size ngay trên thẻ** + nút thêm nhanh vào giỏ; biến thể hết hàng thì size đó bị khoá
- [ ] `ProductGrid`: 2 cột mobile, 3 tablet, 4 desktop
- [ ] `ProductCarousel`: cuộn ngang, có nút trái/phải trên desktop, vuốt trên mobile
- [ ] `CartDrawer`: thêm vào giỏ thì mở drawer bên phải, không chuyển trang
- [ ] Header dính khi cuộn, thu gọn chiều cao sau khi cuộn qua hero
- [ ] `CollectionBanner`: ảnh lớn + tên bộ sưu tập + mô tả ngắn + link, dùng cho khối biên tập trang chủ
- [ ] `Hero`: ảnh toàn chiều rộng, tiêu đề, nút hành động
- [ ] `TrustBar`: ship trong ngày Đà Nẵng · COD toàn quốc · đổi trả · gói quà miễn phí
- [ ] `ContactChannels`: Zalo · Facebook · Instagram · gọi điện, lấy từ `settings`
- [ ] `MobileActionBar`: thanh cố định đáy màn hình trên mobile — Zalo · Gọi · Giỏ hàng
- [ ] `FreeShippingProgress`: thanh "mua thêm X để được miễn phí giao hàng", dùng trong giỏ và trang sản phẩm
- [ ] Nâng menu desktop thành **mega menu**: mở ra bảng gom theo `group`, có ảnh bộ sưu tập nổi bật
- [ ] `SizeGuideModal`: bảng quy đổi size, mở được từ thẻ sản phẩm lẫn trang chi tiết
- [ ] Footer dựng lại theo trung tâm tin cậy: cam kết · liên hệ · ba cột link · dãy biểu tượng thanh toán

> **Xong khi:** mở một trang demo ghép đủ các thành phần trên, chạy tốt ở 3 breakpoint; `grep` không còn chuỗi tiếng Việt nào trong `app/` và `components/`; đổi sang `/en` thì toàn bộ giao diện sang tiếng Anh.

---

## Phase 10 — FE Storefront (URL tiếng Anh)

| Route | Nội dung |
| --- | --- |
| `/` | Banner mùa hiện tại, khối theo từng mùa, sản phẩm nổi bật, quà theo dịp sắp tới |
| `/categories/[slug]` | Sản phẩm của một category, bộ lọc (drawer trên mobile) |
| `/gifts` | Category nhóm OCCASION và sản phẩm làm quà |
| `/products/[slug]` | Gallery, chọn size/màu, báo hết hàng theo biến thể, sản phẩm liên quan |
| `/collections/[slug]` | Một bộ sưu tập theo chủ đề, có ảnh bìa và mô tả |
| `/search` | Kết quả tìm kiếm có bộ lọc |
| `/size-guide`, `/care`, `/shipping`, `/returns`, `/about` | Trang hỗ trợ |

Trang chủ theo bố cục ở mục **Shop thật và điều nó quyết định** — ưu tiên thấy
sản phẩm và giá ngay, không phải lối biên tập của site tham chiếu.

- [ ] `/` theo bố cục đó; khối nào không có dữ liệu thì ẩn hẳn, không hiện khung rỗng
- [ ] `MobileActionBar` hiện trên mọi trang storefront ở khổ mobile
- [ ] `/categories/[slug]`: lưới sản phẩm, bộ lọc (giá, size, màu), sắp xếp; mobile là drawer; filter đồng bộ lên URL để chia sẻ được link đã lọc
- [ ] `/collections/[slug]`: trang bộ sưu tập, có ảnh bìa và mô tả ở đầu
- [ ] `/gifts`: category nhóm OCCASION, nhóm theo dịp
- [ ] `/products/[slug]`: gallery, chọn size và màu, khoá biến thể hết hàng, link mở `SizeGuideModal`, thông tin chất liệu và bảo quản, sản phẩm liên quan
- [ ] `/search`: kết quả có bộ lọc như trang category
- [ ] Trang hỗ trợ: `/size-guide`, `/care`, `/shipping`, `/returns`, `/about`
- [ ] `/feedback`: landing page nhận góp ý (`FEEDBACK_URL` trỏ vào đây thay vì form ngoài)
- [ ] Đổi hết route tiếng Việt cũ (`/qua-tang`, `/san-pham`, `/mua`, `/danh-muc`...) sang tiếng Anh
- [ ] Server Components + metadata cho SEO; ảnh dùng `next/image` với tỉ lệ cố định để không giật layout
- [ ] Xoá trang giữ chỗ `app/search/page.tsx` và `components/layout/coming-soon.tsx`

> **Xong khi:** không còn route tiếng Việt, chọn biến thể hết hàng thì nút thêm giỏ bị khoá.

---

## Phase 11 — FE Giỏ hàng và Guest checkout

- [ ] `/cart`: sửa số lượng, xoá, gọi `/cart/validate` để cập nhật giá và tồn kho mới nhất (thay trang giữ chỗ hiện tại)
- [ ] `/checkout`: **chọn hình thức nhận hàng trước**, phí ship đổi theo lựa chọn; ghé nhận thì ẩn phần địa chỉ
- [ ] Họ tên, SĐT (bắt buộc, kiểm tra định dạng VN), email, tỉnh/thành, xã/phường, địa chỉ, ghi chú — đều nhập tự do; hiện phí ship và tổng tiền
- [ ] Báo lỗi rõ khi hết hàng lúc đặt, chặn bấm gửi hai lần
- [ ] `/order-success/[code]`: mã đơn, tóm tắt, lời nhắn "chúng tôi sẽ gọi xác nhận trong X giờ", xoá giỏ
- [ ] `/orders/track`: tra cứu đơn bằng **mã đơn + số điện thoại**, hiện trạng thái và các mốc đã qua. Khách không có tài khoản nên đây là đường duy nhất để họ tự xem đơn; cần endpoint công khai ở Phase 7 (chỉ trả dữ liệu khi mã và SĐT khớp, có throttle chống dò mã)

> **Xong khi:** đặt được đơn end-to-end không cần tài khoản, email xác nhận về Mailpit.

---

## Phase 12a — FE Admin: đăng nhập và quản lý catalog

Làm ngay sau Phase 4. Đây là lát cắt đầu tiên khiến trang quản trị dùng được thật.

Admin nằm trong chính app `apps/frontend`, không phải workspace riêng — dùng
chung design system, `apiFetch`, `formatVnd` đã có từ Phase 9.

Lưu ý về layout: layout của Next lồng nhau, nên `app/admin/layout.tsx` vẫn nằm
**bên trong** `app/layout.tsx` và sẽ kéo theo Header + Footer của storefront.
Muốn admin có khung riêng thì phải đẩy storefront xuống một route group
`app/(storefront)/` và để layout gốc chỉ còn phần dùng chung:

```
app/
├── layout.tsx            <html>, font, <Toaster /> — không Header/Footer
├── (storefront)/
│   ├── layout.tsx        Header + Footer
│   ├── page.tsx          trang chủ
│   ├── cart/ search/ ...
└── admin/
    ├── layout.tsx        sidebar + topbar
    ├── login/page.tsx
    └── categories/ products/ ...
```

Route group `(storefront)` không xuất hiện trong URL, nên `/`, `/cart` giữ
nguyên đường dẫn.

- [ ] `/admin/login`: form đăng nhập, lưu JWT, báo lỗi sai mật khẩu rõ ràng
- [ ] Middleware chặn toàn bộ `/admin/*` khi chưa đăng nhập, hết hạn token thì đá về login
- [ ] Tách route group: chuyển trang storefront vào `app/(storefront)/` với layout chứa Header + Footer, `app/layout.tsx` gốc chỉ còn `<html>`, font và `<Toaster />`
- [ ] Khung admin ở `app/admin/layout.tsx`: sidebar + topbar, **không có header/footer của storefront**, có nút đăng xuất
- [ ] Mọi form có trường dịch được đều có **tab vi / en**; bỏ trống tiếng Anh thì lưu được, hiển thị rơi về tiếng Việt
- [ ] Quản lý category: danh sách gom theo `group` (gồm cả `COLLECTION`), tạo / sửa / bật tắt / đổi `sortOrder`
- [ ] Quản lý size và màu (`variant_options`): thêm / sửa / ẩn, màu có chọn mã hex
- [ ] Quản lý product: danh sách có tìm kiếm và phân trang, tạo / sửa, gán nhiều category, thêm biến thể (size + màu + giá + tồn kho)

> **Xong khi:** đăng nhập vào `/admin` tạo được category và một product có ít nhất hai biến thể; đăng xuất rồi mở lại `/admin/products` thì bị đá về trang login.

---

## Phase 12b — FE Admin: ảnh sản phẩm

Làm ngay sau Phase 5.

- [ ] Khung upload trong trang sửa product: xin presigned URL rồi `PUT` thẳng lên R2, có thanh tiến trình
- [ ] Gắn ảnh đã upload vào product, kéo thả đổi thứ tự, xoá ảnh
- [ ] Báo lỗi rõ khi sai định dạng hoặc quá 5 MB, kiểm trước khi gọi API

> **Xong khi:** ảnh đi thẳng từ trình duyệt lên R2 (tab Network không thấy file nào đi qua backend) và hiện trong trang sửa product sau khi tải lại.

---

## Phase 12c — FE Admin: đơn hàng, dashboard, cài đặt

Làm ngay sau Phase 8, khi đã có đơn hàng thật và email chạy được.

- [ ] Dashboard: số đơn theo từng status, doanh thu đơn COMPLETED theo ngày
- [ ] Đơn hàng: danh sách + lọc theo status và ngày, tìm theo mã / SĐT / email
- [ ] Chi tiết đơn: thông tin khách, các dòng hàng, tổng tiền, ghi chú nội bộ sửa được
- [ ] Nút đổi status **chỉ hiện các bước hợp lệ** theo bảng luồng ở Phase 7; huỷ đơn phải xác nhận
- [ ] Timeline lịch sử đổi status: ai đổi, lúc nào
- [ ] Trạng thái email đã gửi cho từng đơn (xác nhận, feedback, báo team)
- [ ] Trang cài đặt: quản lý **hình thức giao hàng** (thêm/sửa/ẩn, phí, ngưỡng miễn phí, thời gian dự kiến) và kênh liên hệ Zalo / Facebook / Instagram / điện thoại

> **Xong khi:** đổi một đơn sang COMPLETED thì khách nhận email feedback trong Mailpit, và giao diện không cho chuyển status sai luồng (ví dụ PENDING_CONFIRMATION thẳng sang SHIPPING).

---

## Phase 13 — Hoàn thiện và Deploy

- [ ] E2E Playwright: xem sản phẩm → thêm giỏ → checkout → admin xác nhận → COMPLETED → kiểm tra email feedback
- [ ] SEO: sitemap, robots, Open Graph, structured data cho sản phẩm
- [ ] `next/image` khai báo `remotePatterns` cho domain R2, Lighthouse ≥ 90 trên mobile
- [x] Dockerfile multi-stage build 1 image chứa cả BE và FE; entrypoint chạy migration trước rồi mới start 2 process (`docker/start.mjs` giám sát, một tiến trình chết là container dừng). Đã build và chạy thử: migration chạy trước, health trả `database: ok`, FE render
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
| 6 | Phí ship | ~~Một mức phẳng 20.000 ₫~~ → **bảng `shipping_methods` admin tự quản lý**: ghé nhận · hoả tốc · trong ngày Đà Nẵng · COD toàn quốc. Mỗi hình thức có phí và ngưỡng miễn phí riêng |
| 7 | Feedback | Làm landing page trên site, không dùng form ngoài |
| 8 | Repo | ~~Giữ hai repo riêng~~ → **gộp thành monorepo npm workspaces** (`apps/backend`, `apps/frontend`), repo `socks-frontend` đã xoá |
| 9 | Địa chỉ | Hai cấp: tỉnh/thành → xã/phường. Bỏ cấp quận/huyện |
| 10 | Miễn phí ship | Đơn từ 300.000 ₫ trở lên được miễn phí giao hàng |
| 11 | Tài liệu chung | `CLAUDE.md` và `PLAN.md` nằm ở gốc monorepo |
| 12 | Dockerfile | Một image chứa cả hai app, build thẳng từ monorepo |
| 13 | Chỗ đặt trang admin | Route `/admin/*` **trong chính app `apps/frontend`**, không tách workspace riêng |
| 14 | Chuẩn giao diện | Học flow và UX của [bonnemaison.fr](https://www.bonnemaison.fr/); nghiệp vụ theo thói quen Việt Nam |
| 15 | Đa ngôn ngữ | `vi` (mặc định, không tiền tố) + `en` (`/en/...`), `next-intl`, làm từ đầu |
| 16 | Lưu bản dịch trong DB | Cột JSON `{vi, en}`, không tách cột hay bảng riêng. `slug` một bản dùng chung |
| 17 | Lỗi backend | Là i18n key, dịch theo `Accept-Language`; key phải có đủ ở cả hai file ngôn ngữ |
| 18 | Kênh liên hệ | Zalo là chính, kèm Facebook, Instagram, gọi điện. Lưu trong `settings`, admin sửa được |
| 19 | Mặt bằng | Bán online hoàn toàn. Có ghé nhận nhưng **không có cửa hàng trưng bày** — footer không ghi giờ mở cửa |

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

1. **`@longphan93/nestjs-migration` chưa publish bản dùng được.** Monorepo đang
   cài từ `vendor/longphan93-nestjs-migration-1.0.1.tgz` — bản vá build tại chỗ.
   Khi 1.0.2 lên GitHub Packages thì xoá `vendor/` và đổi dependency trong
   `apps/backend/package.json` về `^1.0.2`. Chi tiết 4 điểm cần vá: `vendor/README.md`.

Không còn điểm nào chặn Phase 2.

### Về `@longphan93/nestjs-migration`

Thư viện là lớp bọc API fluent (`createTable`, `column().string().nullable()`)
lên trên QueryRunner của TypeORM hoặc Sequelize. Đã áp dụng cho dự án này ở
Phase 1, nhưng phải tự làm thêm ba phần vì D1 chỉ truy cập được qua HTTPS:

1. **`D1GatewayExecutor`** (`apps/backend/src/database/executors/`) — thư viện
   không có executor nào nối tới D1 được, nên executor này sinh thẳng DDL SQLite
   từ DSL và đẩy qua gateway. Nó gom câu lệnh thay vì chạy ngay, vì SQLite không
   thêm được khoá chính / khoá ngoại sau `CREATE TABLE` trong khi
   `CreateTableBuilder` gọi `createTable()` trước rồi mới chạy action.
2. **`MigrationRunnerService`** — thư viện không có runner theo dõi migration nào
   đã chạy (phần đó vốn do ORM lo). Runner ghi sổ vào bảng `migrations`, và gửi
   mọi câu lệnh của một migration cùng dòng ghi sổ trong một D1 batch nguyên tử.
3. **Bản vá cho chính package** — xem `vendor/README.md`.

Giới hạn còn lại: `updateTable`, `createForeignKey`, `createPrimary` trên bảng
đã tồn tại sẽ bị executor chặn kèm thông báo, vì SQLite không làm được. Đổi khoá
của bảng đã có dữ liệu thì phải tạo bảng mới rồi chép sang.
