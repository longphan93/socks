import type { Metadata } from 'next';
import { CategoryManager } from '@/components/admin/category-manager';

export const metadata: Metadata = { title: 'Danh mục' };

export default function AdminCategoriesPage() {
  return <CategoryManager />;
}
