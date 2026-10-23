import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateAdminUsersTable1792743792535 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('admin_users', (table) => {
      table.column('id').uuid().primary();
      table.column('email').string().unique();
      table.column('password_hash').string();
      table.column('name').string();
      table.column('created_at').timestamp().default(rawSql("datetime('now')"));
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('admin_users');
  }
}
