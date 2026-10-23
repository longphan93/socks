import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { EmailLogStatusEnum, EmailLogTypeEnum } from '../../common/enums/index.js';
import { pk, timestamp } from './columns.helper.js';

export const emailLogs = sqliteTable(
  'email_logs',
  {
    id: pk(),
    orderId: text().notNull(),
    type: text().$type<EmailLogTypeEnum>().notNull(),
    status: text().$type<EmailLogStatusEnum>().notNull().default(EmailLogStatusEnum.PENDING),
    attempts: integer().notNull().default(0),
    error: text(),
    sentAt: text(),
    createdAt: timestamp(),
  },
  (table) => [
    // Khoá chống gửi trùng: insert hỏng nghĩa là email loại này đã gửi cho đơn đó.
    uniqueIndex('email_logs_order_type_idx').on(table.orderId, table.type),
  ],
);
