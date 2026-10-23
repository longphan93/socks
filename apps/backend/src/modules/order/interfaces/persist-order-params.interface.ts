import { LocaleEnum } from '../../../common/enums/index.js';
import { shippingMethods } from '../../../database/schema/index.js';
import { CreateOrderDto } from '../http/dto/index.js';
import { OrderItemDraftInterface } from './order-item-draft.interface.js';

/** Gom tham số vì ghi đơn cần nhiều hơn ba giá trị. */
export interface PersistOrderParamsInterface {
  dto: CreateOrderDto;
  locale: LocaleEnum;
  method: typeof shippingMethods.$inferSelect;
  items: OrderItemDraftInterface[];
  subtotal: number;
  fee: number;
  isEstimate: boolean;
}
