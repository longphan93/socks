# Frontend

Next.js 16 App Router, React 19, Tailwind CSS v4.

Cách chạy cả monorepo: [../../README.md](../../README.md). Quy ước code:
[../../CLAUDE.md](../../CLAUDE.md).

## Cấu trúc

```
app/              route (URL tiếng Anh)
components/ui/    design system: Button, Input, Select, Badge, Modal, Toast, Skeleton
components/layout/ header, footer, menu, ô tìm kiếm, nút giỏ hàng
lib/api/          client gọi backend + type chung
lib/cart/         giỏ hàng Zustand lưu localStorage
lib/format.ts     formatVnd, formatDate
```

## Lưu ý

- `cacheComponents` đang bật. Component đọc dữ liệu đổi theo request phải bọc
  `<Suspense>`; dữ liệu cache được thì dùng `'use cache'` + `cacheLife()`.
- Giỏ hàng nằm ở `localStorage`, không có tài khoản khách. Dùng
  `useCartHydrated()` trước khi hiển thị số lượng để tránh lệch hydrate.
- Chạy ở cổng 4001; backend ở 4000 và đã bật CORS cho origin này.
- Build production dùng `output: 'standalone'` để Docker image không cần
  `node_modules` của FE.
