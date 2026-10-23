/** Hình dạng response chung của backend. */
export interface ApiEnvelope<T> {
  data: T;
  message: string | null;
  meta: Record<string, unknown> | null;
}

/**
 * Backend giải ngôn ngữ trước khi trả, nên mọi trường dịch được ở đây đã là
 * chuỗi — client không nhận object `{vi, en}`.
 */

/* ------------------------------------------------------------- danh mục */

/**
 * Category gộp luôn vai trò mùa và dịp tặng quà — không có bảng Season riêng.
 * `group` quyết định category hiện ở đâu trên menu.
 */
export const CATEGORY_GROUPS = ['SEASON', 'TYPE', 'AUDIENCE', 'OCCASION', 'COLLECTION'] as const;

export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  SEASON: 'Theo mùa',
  TYPE: 'Kiểu tất',
  AUDIENCE: 'Đối tượng',
  OCCASION: 'Dịp tặng quà',
  COLLECTION: 'Bộ sưu tập',
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  group: CategoryGroup;
  description: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
}

/* ----------------------------------------------------------- sản phẩm */

export interface VariantOption {
  id: string;
  value: string;
  label: string;
  /** Chỉ có với màu, để vẽ ô màu. */
  hexColor?: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: VariantOption;
  color: VariantOption;
  /** VND, số nguyên. */
  price: number;
  stock: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

export type ProductDetail = Product;

/** Dạng rút gọn cho lưới và danh sách quản trị. */
export type ProductSummary = Omit<Product, 'description' | 'images' | 'categories'> & {
  image: ProductImage | null;
};

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Khoảng giá lấy từ các biến thể; bằng nhau khi mọi biến thể cùng giá. */
  priceMin: number;
  priceMax: number;
  isFeatured: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  categories: Pick<Category, 'id' | 'slug' | 'name' | 'group'>[];
}

/* ----------------------------------------------------------- giao hàng */

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  description: string | null;
  /** Phí hiển thị; với hình thức phí dao động thì đây là mức tối thiểu. */
  fee: number;
  /**
   * Có giá trị nghĩa là phí thay đổi theo quãng đường (hoả tốc): giao diện hiện
   * khoảng `fee`–`feeMax` và nói rõ chốt khi nhân viên gọi xác nhận.
   */
  feeMax: number | null;
  /** Tổng hàng vượt mức này thì miễn phí giao. */
  freeFrom: number | null;
  areaNote: string | null;
  estimatedTime: string | null;
  /** Khách tự tới lấy: checkout không hỏi địa chỉ giao. */
  isPickup: boolean;
}

/* -------------------------------------------------------------- đơn hàng */

export const ORDER_STATUSES = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

/* --------------------------------------------------------------- quản trị */

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
}

export interface LoginResult {
  accessToken: string;
  expiresIn: string;
  admin: AdminProfile;
}

export const VARIANT_OPTION_KINDS = ['SIZE', 'COLOR'] as const;

export type VariantOptionKind = (typeof VARIANT_OPTION_KINDS)[number];

/** Khác `VariantOption` ở chỗ có kind và trạng thái; dùng trong trang quản trị. */
export interface VariantOptionDetail {
  id: string;
  kind: VariantOptionKind;
  value: string;
  label: string;
  hexColor: string | null;
  sortOrder: number;
  isActive: boolean;
}

/** Nội dung dịch được khi gửi lên API: tiếng Việt bắt buộc. */
export interface TranslatedField {
  vi: string;
  en?: string;
}

/** Ảnh sản phẩm ở trang quản trị: kèm khoá object và thứ tự. */
export interface ProductImageDetail {
  id: string;
  url: string;
  r2Key: string;
  alt: string | null;
  sortOrder: number;
}
