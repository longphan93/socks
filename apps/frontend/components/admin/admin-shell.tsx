'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSyncExternalStore, useState, type ReactNode } from 'react';
import { clearSession, readProfile } from '@/lib/admin/auth';
import type { AdminProfile } from '@/lib/api/types';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/admin', label: 'Tổng quan', exact: true },
  { href: '/admin/products', label: 'Sản phẩm' },
  { href: '/admin/categories', label: 'Danh mục' },
  { href: '/admin/variant-options', label: 'Size và màu' },
];

/** Hồ sơ chỉ đổi khi đăng nhập hoặc đăng xuất, cả hai đều tải lại trang. */
const subscribeNothing = () => () => undefined;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  // Hồ sơ nằm ở localStorage nên server không đọc được; lần render đầu phải
  // khớp với server rồi mới điền vào sau khi hydrate.
  const profile = useSyncExternalStore<AdminProfile | null>(
    subscribeNothing,
    readProfile,
    () => null,
  );

  function signOut() {
    clearSession();
    router.replace('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-border bg-surface transition-transform lg:static lg:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/admin" className="font-semibold tracking-tight text-brand-700">
            Tất &amp; Quà
          </Link>
          <span className="ml-2 rounded bg-surface-sunken px-1.5 py-0.5 text-xs text-ink-subtle">
            quản trị
          </span>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {menuOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu"
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink hover:bg-surface-sunken lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" className="text-sm text-ink-muted hover:text-ink">
            Xem cửa hàng ↗
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">
              {profile?.name ?? profile?.email ?? ''}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:bg-surface-sunken"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
