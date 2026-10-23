import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateOrdersTable1792743792794 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('orders', (table) => {
      table.column('id').uuid().primary();
      table.column('code').string().unique();

      table.column('customer_name').string();
      table.column('phone').string().index();
      table.column('email').string().nullable();
      // Trống khi khách chọn ghé nhận.
      table.column('province').string().nullable();
      table.column('ward').string().nullable();
      table.column('street').string().nullable();
      table.column('note').text().nullable();
      table.column('locale').string().default('vi');

      table.column('shipping_method_id').uuid().foreign('shipping_methods');
      table.column('subtotal').integer();
      table.column('discount').integer().default(0);
      table.column('discount_note').text().nullable();
      table.column('shipping_fee').integer().default(0);
      // Hình thức có khoảng phí thì số lúc đặt chưa phải số cuối.
      table.column('shipping_fee_is_estimate').boolean().default(false);
      table.column('total').integer();

      table.column('status').string().default('PENDING_CONFIRMATION').index();
      table.column('internal_note').text().nullable();
      table.column('created_at').timestamp().default(rawSql("datetime('now')")).index();
      table.column('updated_at').timestamp().default(rawSql("datetime('now')"));
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('orders');
  }
}
