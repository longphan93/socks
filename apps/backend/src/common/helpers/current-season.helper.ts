import { SEASON_SLUG_BY_MONTH } from '../constants/index.js';

/**
 * Slug của category mùa ứng với tháng hiện tại, theo khí hậu miền Trung.
 *
 * Trang chủ dùng nó để chọn khối sản phẩm theo mùa mà không cần admin đổi tay
 * mỗi quý.
 */
export function currentSeasonSlug(now: Date = new Date()): string {
  return SEASON_SLUG_BY_MONTH[now.getMonth()];
}
