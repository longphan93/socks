/**
 * D1 chỉ nhận tối đa 100 tham số bind trong một câu lệnh.
 *
 * Insert nhiều dòng vượt mức này thì D1 trả "too many SQL variables", nên mọi
 * insert hàng loạt phải chia nhỏ theo số cột của bảng.
 */
export const D1_MAX_BOUND_PARAMS = 100;
