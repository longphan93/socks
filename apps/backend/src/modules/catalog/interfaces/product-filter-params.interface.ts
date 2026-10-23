import { ProductSortEnum } from '../enums/index.js';

/** Tham số lọc danh sách sản phẩm, gom một object vì vượt 3 tham số vị trí. */
export interface ProductFilterParamsInterface {
  /** Nhiều slug nghĩa là sản phẩm phải thuộc TẤT CẢ các category đó. */
  categorySlugs?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Lọc theo `variant_options.value`, ví dụ "39-42". */
  sizes?: string[];
  colors?: string[];
  featuredOnly?: boolean;
  sort: ProductSortEnum;
  page: number;
  limit: number;
}
