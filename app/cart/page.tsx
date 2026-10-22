import type { Metadata } from 'next';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'Giỏ hàng' };

export default function CartPage() {
  return (
    <ComingSoon
      title="Giỏ hàng"
      phase="Phase 11 — FE Giỏ hàng và Guest checkout"
    />
  );
}
