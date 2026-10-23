import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateShippingMethodsTable1792743792593 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('shipping_methods', (table) => {
      table.column('id').uuid().primary();
      table.column('code').string().unique();
      table.column('name').text();
      table.column('description').text().nullable();
      table.column('fee').integer().default(0);
      // Có giá trị nghĩa là phí dao động (hoả tốc): giao diện hiện dạng khoảng.
      table.column('fee_max').integer().nullable();
      table.column('free_from').integer().nullable();
      table.column('area_note').text().nullable();
      table.column('estimated_time').text().nullable();
      table.column('is_pickup').boolean().default(false);
      table.column('sort_order').integer().default(0);
      table.column('is_active').boolean().default(true).index();
      table.column('created_at').timestamp().default(rawSql("datetime('now')"));
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('shipping_methods');
  }
}
