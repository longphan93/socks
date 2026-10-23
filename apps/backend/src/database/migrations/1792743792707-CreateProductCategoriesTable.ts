import { AbstractD1Migration } from '../abstract-d1.migration.js';

export class CreateProductCategoriesTable1792743792707 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('product_categories', (table) => {
      table.column('product_id').uuid().foreign('products');
      table.column('category_id').uuid().foreign('categories').index();
      table.column('sort_order').integer().default(0);
      table.primaryColumns(['product_id', 'category_id']);
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('product_categories');
  }
}
