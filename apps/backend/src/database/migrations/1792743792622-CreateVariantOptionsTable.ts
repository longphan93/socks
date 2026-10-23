import { AbstractD1Migration } from '../abstract-d1.migration.js';

export class CreateVariantOptionsTable1792743792622 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('variant_options', (table) => {
      table.column('id').uuid().primary();
      table.column('kind').string();
      table.column('value').string();
      table.column('label').text();
      table.column('hex_color').string().nullable();
      table.column('sort_order').integer().default(0);
      table.column('is_active').boolean().default(true);
    });

    // DSL chưa có unique nhiều cột nên dựng index bằng SQL.
    await this.runSQL(
      'CREATE UNIQUE INDEX IF NOT EXISTS "variant_options_kind_value_idx" ON "variant_options" ("kind", "value")',
    );
  }

  async rollback(): Promise<void> {
    await this.dropTable('variant_options');
  }
}
