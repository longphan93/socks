import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateProductsTable1792743792679 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('products', (table) => {
      table.column('id').uuid().primary();
      table.column('name').text();
      table.column('description').text().nullable();
      table.column('slug').string().unique();
      // Bản sao khoảng giá từ biến thể, để trang danh sách khỏi phải join.
      table.column('price_min').integer().default(0);
      table.column('price_max').integer().default(0);
      table.column('is_active').boolean().default(true).index();
      table.column('is_featured').boolean().default(false);
      table.column('created_at').timestamp().default(rawSql("datetime('now')")).index();
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('products');
  }
}
