import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateShipmentsTable1792743792880 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('shipments', (table) => {
      table.column('id').uuid().primary();
      table.column('order_id').uuid().foreign('orders').index();
      table.column('provider').string().default('MANUAL');
      table.column('tracking_code').string().nullable();
      table.column('status').string().nullable();
      table.column('fee').integer().default(0);
      table.column('raw_payload').text().nullable();
      table.column('created_at').timestamp().default(rawSql("datetime('now')"));
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('shipments');
  }
}
