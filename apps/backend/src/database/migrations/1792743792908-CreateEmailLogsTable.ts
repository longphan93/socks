import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateEmailLogsTable1792743792908 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('email_logs', (table) => {
      table.column('id').uuid().primary();
      table.column('order_id').uuid().foreign('orders');
      table.column('type').string();
      table.column('status').string().default('PENDING');
      table.column('attempts').integer().default(0);
      table.column('error').text().nullable();
      table.column('sent_at').timestamp().nullable();
      table.column('created_at').timestamp().default(rawSql("datetime('now')"));
    });

    // Khoá chống gửi trùng: insert hỏng nghĩa là email loại này đã gửi cho đơn đó.
    await this.runSQL(
      'CREATE UNIQUE INDEX IF NOT EXISTS "email_logs_order_type_idx" ON "email_logs" ("order_id", "type")',
    );
  }

  async rollback(): Promise<void> {
    await this.dropTable('email_logs');
  }
}
