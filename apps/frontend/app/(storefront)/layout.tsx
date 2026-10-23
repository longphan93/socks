import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';

/**
 * Khung của phần bán hàng. Tách khỏi layout gốc vì layout của Next lồng nhau:
 * để Header/Footer ở gốc thì trang admin cũng đeo theo cả menu danh mục và nút
 * giỏ hàng.
 *
 * Route group `(storefront)` không xuất hiện trong URL nên `/`, `/cart` giữ
 * nguyên đường dẫn.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
