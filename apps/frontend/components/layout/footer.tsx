import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Mua sắm',
    links: [
      { href: '/products', label: 'Tất cả sản phẩm' },
      { href: '/gifts', label: 'Quà tặng' },
      { href: '/cart', label: 'Giỏ hàng' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { href: '/shipping', label: 'Giao hàng' },
      { href: '/returns', label: 'Đổi trả' },
      { href: '/contact', label: 'Liên hệ' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-muted">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <span className="text-lg font-semibold tracking-tight text-brand-700">
            Tất &amp; Quà
          </span>
          <p className="max-w-sm text-sm text-ink-muted">
            Tất theo mùa và quà tặng cho mọi dịp. Đặt hàng không cần tài khoản,
            đội ngũ sẽ gọi xác nhận trước khi giao.
          </p>
          <p className="text-sm text-ink-subtle">
            Thanh toán khi nhận hàng (COD)
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink">{column.title}</p>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page py-5 text-sm text-ink-subtle">
          {/* Không dùng new Date() ở đây: cacheComponents coi đó là dữ liệu đổi theo
              thời gian và sẽ bắt bọc Suspense, không đáng cho một dòng copyright. */}
          © Tất &amp; Quà
        </div>
      </div>
    </footer>
  );
}
