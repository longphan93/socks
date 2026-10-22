import { CreateTableBuilder } from '@longphan93/nestjs-migration';
import { describe, expect, it } from 'vitest';
import { rawSql } from '../helpers/raw-sql.helper.js';
import { D1GatewayExecutor } from './d1-gateway.executor.js';

async function sqlOf(build: (table: CreateTableBuilder) => void, name = 'products'): Promise<string[]> {
  const executor = new D1GatewayExecutor();
  const builder = new CreateTableBuilder(name);
  build(builder);
  await builder.execute(executor);

  return executor.collect().map((statement) => statement.sql);
}

describe('D1GatewayExecutor', () => {
  it('dựng CREATE TABLE với NOT NULL mặc định', async () => {
    const [sql] = await sqlOf((table) => {
      table.column('id').uuid().primary();
      table.column('name').string();
      table.column('note').text().nullable();
    });

    expect(sql).toBe(
      'CREATE TABLE IF NOT EXISTS "products" (\n' +
        '  "id" TEXT PRIMARY KEY NOT NULL,\n' +
        '  "name" TEXT NOT NULL,\n' +
        '  "note" TEXT\n' +
        ')',
    );
  });

  it('gộp khoá ngoại vào CREATE TABLE chứ không ALTER sau', async () => {
    const [sql, ...rest] = await sqlOf((table) => {
      table.column('id').uuid().primary();
      table.column('category_id').uuid().foreign('categories');
    });

    expect(sql).toContain('FOREIGN KEY ("category_id") REFERENCES "categories" ("id")');
    expect(rest).toHaveLength(0);
  });

  it('đưa khoá chính nhiều cột xuống cuối bảng', async () => {
    const [sql] = await sqlOf((table) => {
      table.column('product_id').uuid();
      table.column('category_id').uuid();
      table.primaryColumns(['product_id', 'category_id']);
    }, 'product_categories');

    expect(sql).toContain('PRIMARY KEY ("product_id", "category_id")');
    expect(sql).not.toContain('"product_id" TEXT PRIMARY KEY');
  });

  it('tạo index sau CREATE TABLE, không gộp vào trong', async () => {
    const [create, index] = await sqlOf((table) => {
      table.column('id').uuid().primary();
      table.column('slug').string().index();
    });

    expect(create.startsWith('CREATE TABLE')).toBe(true);
    expect(index).toBe('CREATE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug")');
  });

  it('AUTOINCREMENT chỉ chấp nhận trên integer primary key', async () => {
    const [sql] = await sqlOf((table) => {
      table.column('id').integer().primary().autoIncrement();
    });

    expect(sql).toContain('"id" INTEGER PRIMARY KEY AUTOINCREMENT');

    await expect(
      sqlOf((table) => {
        table.column('id').uuid().primary().autoIncrement();
      }),
    ).rejects.toThrow(/AUTOINCREMENT/);
  });

  it('từ chối khai báo khoá chính hai lần', async () => {
    await expect(
      sqlOf((table) => {
        table.column('id').uuid().primary();
        table.primaryColumns(['id']);
      }),
    ).rejects.toThrow(/hai lần/);
  });

  it.each([
    [rawSql("datetime('now')"), "DEFAULT (datetime('now'))"],
    [0, 'DEFAULT 0'],
    [true, 'DEFAULT 1'],
    ["Gi'a", "DEFAULT 'Gi''a'"],
  ])('dựng DEFAULT từ %s', async (value, expected) => {
    const [sql] = await sqlOf((table) => {
      table.column('id').uuid().primary();
      table.column('x').string().default(value);
    });

    expect(sql).toContain(expected);
  });

  it('không cho thêm khoá ngoại hay khoá chính vào bảng đã tồn tại', async () => {
    const executor = new D1GatewayExecutor();

    await expect(
      executor.createForeignKey('orders', { columns: ['a'], referenceTable: 'b', referenceColumns: ['id'] } as never),
    ).rejects.toThrow(/SQLite chỉ nhận FOREIGN KEY lúc CREATE TABLE/);

    await expect(
      executor.createPrimary('orders', { columns: ['a'] } as never),
    ).rejects.toThrow(/SQLite chỉ nhận PRIMARY KEY lúc CREATE TABLE/);
  });

  it('chặn ADD COLUMN không NULL mà không có DEFAULT', async () => {
    const executor = new D1GatewayExecutor();

    await expect(
      executor.createColumn('orders', { name: 'total', type: 'integer' as never, isNullable: false }),
    ).rejects.toThrow(/cho phép NULL hoặc có DEFAULT/);
  });

  it('xả bảng đang chờ trước khi chạy câu lệnh khác', async () => {
    const executor = new D1GatewayExecutor();
    await executor.createTable('a', [{ name: 'id', type: 'uuid' as never, isPrimary: true }]);
    await executor.dropTable('b');

    const [first, second] = executor.collect().map((statement) => statement.sql);

    expect(first.startsWith('CREATE TABLE IF NOT EXISTS "a"')).toBe(true);
    expect(second).toBe('DROP TABLE IF EXISTS "b"');
  });
});
