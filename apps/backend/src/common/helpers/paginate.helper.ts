import { PaginatedInterface } from '../interfaces/index.js';

/** Đổi kết quả phân trang thành `meta` của response chung. */
export function paginationMeta(result: PaginatedInterface<unknown>): Record<string, number> {
  return {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: Math.ceil(result.total / result.limit) || 1,
  };
}
