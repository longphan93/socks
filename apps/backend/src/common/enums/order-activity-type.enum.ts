/** Một bảng ghi lại mọi thay đổi trên đơn, không chỉ đổi trạng thái. */
export enum OrderActivityTypeEnum {
  STATUS_CHANGED = 'STATUS_CHANGED',
  SHIPPING_FEE_CHANGED = 'SHIPPING_FEE_CHANGED',
  DISCOUNT_CHANGED = 'DISCOUNT_CHANGED',
  NOTE_ADDED = 'NOTE_ADDED',
}
