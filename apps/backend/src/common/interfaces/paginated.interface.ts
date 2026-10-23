/** Kết quả một trang, kèm số liệu để dựng meta của response. */
export interface PaginatedInterface<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
