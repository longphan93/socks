import { AbstractD1Migration } from '../abstract-d1.migration.js';

export class CreateSettingsTable1792743792563 extends AbstractD1Migration {
  async execute(): Promise<void> {
    // Viết thẳng SQL vì DSL chỉ cho .primary() trên uuid và integer, mà khoá
    // chính ở đây là chuỗi key có nghĩa ("contact.zalo") chứ không phải uuid.
    await this.runSQL(`CREATE TABLE IF NOT EXISTS "settings" (
      "key" TEXT PRIMARY KEY NOT NULL,
      "value" TEXT NOT NULL,
      "updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  }

  async rollback(): Promise<void> {
    await this.dropTable('settings');
  }
}
