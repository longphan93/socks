import Link from 'next/link';
import { Suspense } from 'react';
import { getCategoryMenu } from '@/lib/api/categories';
import { CartButton } from './cart-button';
import { DesktopNav } from './desktop-nav';
import { MobileMenu } from './mobile-menu';
import { STATIC_LINKS, toNavGroups } from './nav-links';
import { SearchBox } from './search-box';

export async function Header() {
  const groups = toNavGroups(await getCategoryMenu());

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="bg-brand-700 py-2 text-center text-xs text-white">
        Miễn phí giao hàng cho đơn từ 300.000 ₫ · Gói quà miễn phí
      </div>

      <div className="container-page flex h-16 items-center gap-2">
        <MobileMenu groups={groups} staticLinks={STATIC_LINKS} />

        <Link href="/" className="flex shrink-0 items-center gap-2 pr-2">
          <span className="text-lg font-semibold tracking-tight text-brand-700">
            Tất &amp; Quà
          </span>
        </Link>

        <DesktopNav groups={groups} staticLinks={STATIC_LINKS} />

        <div className="ml-auto flex items-center gap-1">
          {/* useSearchParams cần Suspense để phần còn lại của header vẫn vào được static shell. */}
          <Suspense
            fallback={
              <div className="hidden h-10 w-64 rounded-full bg-surface-muted sm:block" />
            }
          >
            <SearchBox className="hidden w-64 sm:block" />
          </Suspense>
          <CartButton />
        </div>
      </div>

      <div className="container-page pb-3 sm:hidden">
        <Suspense
          fallback={<div className="h-10 rounded-full bg-surface-muted" />}
        >
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
