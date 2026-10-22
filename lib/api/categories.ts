import { cacheLife } from 'next/cache';
import { apiFetch } from './client';
import { CATEGORY_GROUPS, type Category, type CategoryGroup } from './types';

export type CategoryMenu = Record<CategoryGroup, Category[]>;

const EMPTY_MENU: CategoryMenu = {
  SEASON: [],
  TYPE: [],
  AUDIENCE: [],
  OCCASION: [],
};

/**
 * Menu header dựng từ category, nhóm theo `group`.
 *
 * Danh mục đổi rất ít nên cache được; endpoint `/categories` sẽ có từ Phase 4,
 * trước đó header chỉ hiện các link tĩnh thay vì sập.
 */
export async function getCategoryMenu(): Promise<CategoryMenu> {
  'use cache';
  cacheLife('hours');

  try {
    const categories = await apiFetch<Category[]>('/categories');
    return groupByCategoryGroup(categories);
  } catch {
    return EMPTY_MENU;
  }
}

export function groupByCategoryGroup(categories: Category[]): CategoryMenu {
  const menu: CategoryMenu = {
    SEASON: [],
    TYPE: [],
    AUDIENCE: [],
    OCCASION: [],
  };

  for (const category of categories) {
    if (CATEGORY_GROUPS.includes(category.group))
      menu[category.group].push(category);
  }

  return menu;
}

export function isMenuEmpty(menu: CategoryMenu): boolean {
  return CATEGORY_GROUPS.every((group) => menu[group].length === 0);
}
