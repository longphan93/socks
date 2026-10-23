/** Một dòng hàng đã tính giá từ kho dữ liệu, trước khi ghi vào đơn. */
export interface OrderItemDraftInterface {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
