import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateOrderActivitiesTable1792743792852 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('order_activities', (table) => {
      table.column('id').uuid().primary();
      table.column('order_id').uuid().foreign('orders').index();
      table.column('type').string();
      table.column('field').string().nullable();
      table.column('old_value').text().nullable();
      table.column('new_value').text().nullable();
      table.column('note').text().nullable();
      table.column('changed_by').uuid().nullable();
      table.column('created_at').timestamp().default(rawSql("datetime('now')"));
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('order_activities');
  }
}
