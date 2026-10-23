import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateProductImagesTable1792743792764 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('product_images', (table) => {
      table.column('id').uuid().primary();
      table.column('product_id').uuid().foreign('products').index();
      table.column('r2_key').string();
      table.column('url').string();
      table.column('alt').text().nullable();
      table.column('sort_order').integer().default(0);
      table.column('created_at').timestamp().default(rawSql("datetime('now')"));
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('product_images');
  }
}
