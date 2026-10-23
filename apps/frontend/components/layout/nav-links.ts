import { CATEGORY_GROUP_LABELS, type CategoryGroup } from '@/lib/api/types';
import type { CategoryMenu } from '@/lib/api/categories';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavGroup {
  group: CategoryGroup;
  label: string;
  links: NavLink[];
}

/** URL đều tiếng Anh theo quy ước của dự án. */
export const STATIC_LINKS: NavLink[] = [
  { href: '/products', label: 'Tất cả sản phẩm' },
  { href: '/gifts', label: 'Quà tặng' },
];

/** Chỉ trả về nhóm nào thực sự có category, để menu không có mục rỗng. */
export function toNavGroups(menu: CategoryMenu): NavGroup[] {
  return (Object.keys(CATEGORY_GROUP_LABELS) as CategoryGroup[])
    .map((group) => ({
      group,
      label: CATEGORY_GROUP_LABELS[group],
      links: menu[group].map((category) => ({
        href: `/categories/${category.slug}`,
        label: category.name,
      })),
    }))
    .filter((navGroup) => navGroup.links.length > 0);
}
