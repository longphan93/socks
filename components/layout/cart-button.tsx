'use client';

import Link from 'next/link';
import {
  selectTotalQuantity,
  useCartHydrated,
  useCartStore,
} from '@/lib/cart/store';

export function CartButton() {
  const hydrated = useCartHydrated();
  const quantity = useCartStore(selectTotalQuantity);
  const count = hydrated ? quantity : 0;

  return (
    <Link
      href="/cart"
      className="relative inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-sunken"
      aria-label={count > 0 ? `Giỏ hàng, ${count} sản phẩm` : 'Giỏ hàng'}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M6 7h12l-1.2 11.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9L6 7Z"
          strokeLinejoin="round"
        />
        <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
      </svg>

      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[0.6875rem] leading-5 font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
