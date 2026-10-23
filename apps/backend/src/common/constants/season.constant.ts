/**
 * Tháng (0–11) sang slug category nhóm SEASON.
 *
 * Chia theo khí hậu miền Trung: xuân tháng 2–4, hạ 5–7, thu 8–10, đông 11–1.
 */
export const SEASON_SLUG_BY_MONTH = [
  'winter', // tháng 1
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'autumn',
  'autumn',
  'autumn',
  'winter',
  'winter', // tháng 12
] as const;
