import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateCategoriesTable1792743792649 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('categories', (table) => {
      table.column('id').uuid().primary();
      table.column('name').text();
      table.column('description').text().nullable();
      table.column('slug').string().unique();
      table.column('group').string().index();
      table.column('image_url').string().nullable();
      table.column('sort_order').integer().default(0);
      table.column('is_active').boolean().default(true);
      table.column('is_featured').boolean().default(false);
      table.column('created_at').timestamp().default(rawSql("datetime('now')"));
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('categories');
  }
}
