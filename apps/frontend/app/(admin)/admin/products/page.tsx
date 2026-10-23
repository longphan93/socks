import type { Metadata } from 'next';
import { ProductManager } from '@/components/admin/product-manager';

export const metadata: Metadata = { title: 'Sản phẩm' };

export default function AdminProductsPage() {
  return <ProductManager />;
}
