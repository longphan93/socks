import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { DeliveryProviderEnum } from '../../common/enums/index.js';
import { money, pk, timestamp } from './columns.helper.js';

/** Chưa dùng trong MVP; có sẵn để Phase sau cắm GHN/GHTK mà không phải migrate. */
export const shipments = sqliteTable(
  'shipments',
  {
    id: pk(),
    orderId: text().notNull(),
    provider: text()
      .$type<DeliveryProviderEnum>()
      .notNull()
      .default(DeliveryProviderEnum.MANUAL),
    trackingCode: text(),
    status: text(),
    fee: money().notNull().default(0),
    rawPayload: text({ mode: 'json' }),
    createdAt: timestamp(),
  },
  (table) => [index('shipments_order_idx').on(table.orderId)],
);
