import Link from 'next/link';

const SHORTCUTS = [
  { href: '/admin/products', title: 'Sản phẩm', body: 'Thêm hàng mới, sửa giá và tồn kho' },
  { href: '/admin/categories', title: 'Danh mục', body: 'Mùa, kiểu tất, đối tượng, dịp tặng quà' },
  { href: '/admin/variant-options', title: 'Size và màu', body: 'Danh sách dùng chung cho mọi sản phẩm' },
];

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Tổng quan</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Số liệu đơn hàng và doanh thu sẽ có ở Phase 12c, sau khi phần đơn hàng xong.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-card border border-border bg-surface p-5 transition-colors hover:border-border-strong"
          >
            <p className="font-medium text-ink">{item.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
