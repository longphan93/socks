import { AbstractD1Migration } from '../abstract-d1.migration.js';

export class CreateOrderItemsTable1792743792824 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('order_items', (table) => {
      table.column('id').uuid().primary();
      table.column('order_id').uuid().foreign('orders').index();
      // Để trống được: biến thể có thể bị gỡ sau này, bản chụp vẫn phải đọc được.
      table.column('variant_id').uuid().nullable();
      table.column('product_name').string();
      table.column('variant_label').string();
      table.column('sku').string();
      table.column('unit_price').integer();
      table.column('quantity').integer();
      table.column('line_total').integer();
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('order_items');
  }
}
