import { cacheLife } from 'next/cache';
import { apiFetch } from './client';
import { CATEGORY_GROUPS, type Category, type CategoryGroup } from './types';

export type CategoryMenu = Record<CategoryGroup, Category[]>;

/** Hình dạng `/categories` trả về: đã gom sẵn theo nhóm, nhóm rỗng bị loại. */
interface CategoryGroupPayload {
  group: CategoryGroup;
  categories: Category[];
}

/** Dựng từ CATEGORY_GROUPS để thêm nhóm không phải sửa hai chỗ. */
function emptyMenu(): CategoryMenu {
  const menu = {} as CategoryMenu;

  for (const group of CATEGORY_GROUPS) {
    menu[group] = [];
  }

  return menu;
}

/**
 * Menu header dựng từ category, nhóm theo `group`.
 *
 * Danh mục đổi rất ít nên cache được. Gọi lỗi thì trả menu rỗng thay vì ném:
 * mất menu còn hơn sập cả trang chủ vì backend tạm thời không lên.
 */
export async function getCategoryMenu(): Promise<CategoryMenu> {
  'use cache';
  cacheLife('hours');

  try {
    return toMenu(await apiFetch<CategoryGroupPayload[]>('/categories'));
  } catch {
    return emptyMenu();
  }
}

export function toMenu(groups: CategoryGroupPayload[]): CategoryMenu {
  const menu = emptyMenu();

  for (const entry of groups) {
    if (CATEGORY_GROUPS.includes(entry.group)) {
      menu[entry.group] = entry.categories;
    }
  }

  return menu;
}

export function isMenuEmpty(menu: CategoryMenu): boolean {
  return CATEGORY_GROUPS.every((group) => menu[group].length === 0);
}
