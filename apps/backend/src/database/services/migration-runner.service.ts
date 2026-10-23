import { readdir } from 'node:fs/promises';
import { Injectable, Logger } from '@nestjs/common';
import { BaseMigration } from '@longphan93/nestjs-migration';
import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { MIGRATIONS_TABLE } from '../constants/index.js';
import { D1GatewayClient } from '../d1-gateway.client.js';
import { D1GatewayExecutor } from '../executors/d1-gateway.executor.js';
import { MigrationFileInterface, SqlStatementInterface } from '../interfaces/index.js';

const MIGRATION_FILE = /^\d+-[A-Za-z0-9]+\.(js|ts)$/;

@Injectable()
export class MigrationRunnerService {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(private readonly gateway: D1GatewayClient) {}

  /** Chạy mọi migration chưa áp dụng, theo thứ tự timestamp trong tên file. */
  async run(): Promise<number> {
    await this.ensureMigrationsTable();

    const applied = await this.appliedNames();
    const pending = (await this.loadMigrations()).filter((file) => !applied.has(file.name));

    if (pending.length === 0) {
      this.logger.log('Không có migration nào cần chạy');

      return 0;
    }

    for (const file of pending) {
      await this.apply(file);
    }

    this.logger.log(`Đã chạy ${pending.length} migration`);

    return pending.length;
  }

  /** Quay lui migration mới nhất. */
  async revert(): Promise<string | null> {
    await this.ensureMigrationsTable();

    const applied = await this.appliedNames();

    if (applied.size === 0) {
      this.logger.log('Chưa có migration nào để quay lui');

      return null;
    }

    const last = [...applied].at(-1)!;
    const file = (await this.loadMigrations()).find((item) => item.name === last);

    if (!file) {
      throw new Error(
        `Migration "${last}" đã chạy nhưng không còn file tương ứng — không quay lui được.`,
      );
    }

    const executor = new D1GatewayExecutor();
    await file.migration.down(executor);

    await this.sendBatch(executor.collect(), {
      sql: `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`,
      params: [last],
    });

    this.logger.log(`Đã quay lui ${last}`);

    return last;
  }

  private async apply(file: MigrationFileInterface): Promise<void> {
    const executor = new D1GatewayExecutor();
    await file.migration.up(executor);

    const statements = executor.collect();

    // D1 chạy batch nguyên tử, nên dòng ghi sổ đi chung với DDL: migration hỏng
    // giữa chừng thì không có gì được ghi lại, chạy lại là sạch.
    await this.sendBatch(statements, {
      sql: `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
      params: [file.name],
    });

    this.logger.log(`${file.name} — ${statements.length} câu lệnh`);
  }

  private sendBatch(
    statements: SqlStatementInterface[],
    bookkeeping: SqlStatementInterface,
  ): Promise<unknown> {
    return this.gateway.batch(
      [...statements, bookkeeping].map((statement) => ({ ...statement, method: 'run' as const })),
    );
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.gateway.query({
      sql: `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      params: [],
      method: 'run',
    });
  }

  private async appliedNames(): Promise<Set<string>> {
    const { rows } = await this.gateway.query({
      sql: `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`,
      params: [],
      method: 'all',
    });

    // Gateway trả rows dạng mảng giá trị, cột duy nhất nằm ở vị trí 0.
    return new Set(((rows ?? []) as unknown[][]).map((row) => String(row[0])));
  }

  /**
   * Nạp migration từ thư mục cạnh file này. Tên file quyết định thứ tự chạy,
   * nên đặt theo `<epoch-ms>-<TenPascalCase>.ts` và lấy số từ đồng hồ thật.
   */
  private async loadMigrations(): Promise<MigrationFileInterface[]> {
    const directory = new URL('../migrations/', import.meta.url);
    const entries = await readdir(directory).catch(() => [] as string[]);
    const files = entries.filter((entry) => MIGRATION_FILE.test(entry)).sort();

    const loaded: MigrationFileInterface[] = [];

    for (const file of files) {
      const module = (await import(new URL(file, directory).href)) as Record<string, unknown>;
      const exported = Object.values(module).find(isMigrationClass);

      if (!exported) {
        throw new Error(`File migration "${file}" không export class nào kế thừa AbstractD1Migration.`);
      }

      loaded.push({
        name: file.replace(/\.(js|ts)$/, ''),
        migration: new exported() as AbstractD1Migration,
      });
    }

    return loaded;
  }
}

function isMigrationClass(value: unknown): value is new () => AbstractD1Migration {
  return typeof value === 'function' && value.prototype instanceof BaseMigration;
}
