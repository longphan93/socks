import type { Metadata } from 'next';
import { VariantOptionManager } from '@/components/admin/variant-option-manager';

export const metadata: Metadata = { title: 'Size và màu' };

export default function AdminVariantOptionsPage() {
  return <VariantOptionManager />;
}
