/** Hình dạng response chung của backend. */
export interface ApiEnvelope<T> {
  data: T;
  message: string | null;
  meta: Record<string, unknown> | null;
}

/**
 * Category gộp luôn vai trò "mùa" — không có bảng Season riêng.
 * `group` quyết định category hiện ở đâu trên menu.
 */
export const CATEGORY_GROUPS = [
  'SEASON',
  'TYPE',
  'AUDIENCE',
  'OCCASION',
] as const;

export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  SEASON: 'Theo mùa',
  TYPE: 'Kiểu tất',
  AUDIENCE: 'Đối tượng',
  OCCASION: 'Dịp tặng quà',
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  group: CategoryGroup;
  description: string | null;
}
