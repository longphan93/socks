/** Mã đơn: SK-YYYYMMDD-XXXX. */
export const ORDER_CODE_PREFIX = 'SK';

/** Bộ ký tự sinh mã, bỏ 0/O/1/I để đọc qua điện thoại không nhầm. */
export const ORDER_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const ORDER_CODE_LENGTH = 4;

/** Số lần sinh lại mã khi trùng. Trùng là hiếm nên vài lần là quá đủ. */
export const ORDER_CODE_MAX_ATTEMPTS = 5;

/** Giới hạn số lượng mỗi dòng, chặn đơn rác xin 10.000 đôi tất. */
export const MAX_QUANTITY_PER_LINE = 50;

export const MAX_LINES_PER_ORDER = 30;
