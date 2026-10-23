import {
  BaseExecutor,
  ColumnTypeEnum,
  CreateForeignKeyAction,
  CreateIndexAction,
  CreatePrimaryKeyAction,
  TableColumnOptions,
} from '@longphan93/nestjs-migration';
import { isRawSql } from '../helpers/raw-sql.helper.js';
import { quoteIdentifier } from '../helpers/quote-identifier.helper.js';
import { SqlStatementInterface } from '../interfaces/index.js';

interface PendingTable {
  name: string;
  columns: TableColumnOptions[];
  primaryKey?: CreatePrimaryKeyAction;
  foreignKeys: CreateForeignKeyAction[];
  indexes: CreateIndexAction[];
}

/**
 * Executor chạy DSL migration của @longphan93/nestjs-migration trên Cloudflare D1.
 *
 * Hai executor có sẵn của thư viện bám vào QueryRunner của TypeORM và instance
 * Sequelize; D1 chỉ nói chuyện qua HTTPS nên không dùng được cái nào. Executor
 * này sinh thẳng DDL của SQLite và gom lại thành danh sách câu lệnh để runner
 * gửi sang gateway trong một batch nguyên tử.
 *
 * Nó KHÔNG chạy lệnh ngay lúc được gọi. SQLite không thêm được khoá chính hay
 * khoá ngoại sau khi bảng đã tạo, trong khi `CreateTableBuilder` gọi
 * `createTable()` trước rồi mới chạy các action, nên bảng được giữ ở trạng thái
 * chờ cho tới khi gom đủ ràng buộc.
 */
export class D1GatewayExecutor extends BaseExecutor {
  private readonly statements: SqlStatementInterface[] = [];
  private pending: PendingTable | null = null;

  constructor() {
    super('sqlite');
  }

  async createTable(name: string, columns: TableColumnOptions[]): Promise<void> {
    this.flushPendingTable();
    this.pending = { name, columns, foreignKeys: [], indexes: [] };
  }

  async createPrimary(table: string, action: CreatePrimaryKeyAction): Promise<void> {
    if (this.pending?.name !== table) {
      throw new Error(
        `Không thêm được khoá chính vào bảng "${table}" đã tồn tại: SQLite chỉ nhận PRIMARY KEY lúc CREATE TABLE. Hãy tạo bảng mới rồi chép dữ liệu sang.`,
      );
    }

    this.pending.primaryKey = action;
  }

  async createForeignKey(table: string, action: CreateForeignKeyAction): Promise<void> {
    if (this.pending?.name !== table) {
      throw new Error(
        `Không thêm được khoá ngoại vào bảng "${table}" đã tồn tại: SQLite chỉ nhận FOREIGN KEY lúc CREATE TABLE. Hãy tạo bảng mới rồi chép dữ liệu sang.`,
      );
    }

    this.pending.foreignKeys.push(action);
  }

  async createIndex(table: string, action: CreateIndexAction): Promise<void> {
    // `CreateTableBuilder` chạy action của cột (trong đó có .index()) TRƯỚC
    // action của bảng (primaryColumns). Xả bảng ngay ở đây thì khoá chính
    // nhiều cột không bao giờ kịp vào CREATE TABLE, nên index của bảng đang
    // chờ được giữ lại và phát sau khi xả.
    if (this.pending?.name === table) {
      this.pending.indexes.push(action);

      return;
    }

    this.push(this.renderIndex(table, action));
  }

  async createColumn(table: string, column: TableColumnOptions): Promise<void> {
    this.flushPendingTable();

    if (column.isPrimary || column.isUnique) {
      throw new Error(
        `Không thêm được cột "${column.name}" là PRIMARY KEY hay UNIQUE vào bảng đã tồn tại: SQLite không cho phép. Dùng CREATE UNIQUE INDEX cho ràng buộc unique.`,
      );
    }

    if (!column.isNullable && column.default === undefined) {
      throw new Error(
        `Cột "${column.name}" thêm vào bảng "${table}" phải cho phép NULL hoặc có DEFAULT: SQLite không biết điền gì cho các dòng sẵn có.`,
      );
    }

    this.push(`ALTER TABLE ${quoteIdentifier(table)} ADD COLUMN ${this.renderColumn(column)}`);
  }

  async dropColumn(table: string, column: string): Promise<void> {
    this.flushPendingTable();
    this.push(
      `ALTER TABLE ${quoteIdentifier(table)} DROP COLUMN ${quoteIdentifier(column)}`,
    );
  }

  async dropTable(name: string): Promise<void> {
    this.flushPendingTable();
    this.push(`DROP TABLE IF EXISTS ${quoteIdentifier(name)}`);
  }

  async runSQL(query: string): Promise<void> {
    this.flushPendingTable();
    this.push(query);
  }

  /** Lấy toàn bộ câu lệnh đã gom, kể cả bảng còn đang chờ. */
  collect(): SqlStatementInterface[] {
    this.flushPendingTable();

    return [...this.statements];
  }

  private push(sql: string, params: unknown[] = []): void {
    this.statements.push({ sql, params });
  }

  private flushPendingTable(): void {
    if (!this.pending) return;

    const { name, columns, primaryKey, foreignKeys, indexes } = this.pending;
    this.pending = null;

    const inlinePrimary = columns.filter((column) => column.isPrimary);

    if (inlinePrimary.length > 0 && primaryKey) {
      throw new Error(
        `Bảng "${name}" khai báo khoá chính hai lần: vừa .primary() trên cột, vừa primaryColumns(). Chọn một.`,
      );
    }

    const parts = columns.map((column) =>
      this.renderColumn(column, inlinePrimary.length === 1),
    );

    if (primaryKey) {
      parts.push(`PRIMARY KEY (${primaryKey.columns.map(quoteIdentifier).join(', ')})`);
    }

    for (const foreignKey of foreignKeys) {
      parts.push(this.renderForeignKey(foreignKey));
    }

    this.push(
      `CREATE TABLE IF NOT EXISTS ${quoteIdentifier(name)} (\n  ${parts.join(',\n  ')}\n)`,
    );

    for (const index of indexes) {
      this.push(this.renderIndex(name, index));
    }
  }

  private renderIndex(table: string, action: CreateIndexAction): string {
    const name = action.constraintName ?? `${table}_${action.columns.join('_')}_idx`;
    const columns = action.columns.map(quoteIdentifier).join(', ');

    return `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(name)} ON ${quoteIdentifier(table)} (${columns})`;
  }

  private renderColumn(column: TableColumnOptions, allowInlinePrimary = true): string {
    const parts = [quoteIdentifier(column.name), this.driver.mapColumnType(column.type!)];

    if (column.isPrimary && allowInlinePrimary) {
      parts.push('PRIMARY KEY');

      // AUTOINCREMENT chỉ hợp lệ trên INTEGER PRIMARY KEY, tức alias của rowid.
      if (column.autoIncrement) {
        if (column.type !== ColumnTypeEnum.INTEGER) {
          throw new Error(
            `Cột "${column.name}" dùng autoIncrement nhưng không phải kiểu integer: SQLite chỉ cho AUTOINCREMENT trên INTEGER PRIMARY KEY.`,
          );
        }

        parts.push('AUTOINCREMENT');
      }
    }

    if (!column.isNullable) parts.push('NOT NULL');

    if (column.isUnique) parts.push('UNIQUE');

    if (column.default !== undefined) {
      parts.push(`DEFAULT ${this.renderDefault(column.default)}`);
    }

    return parts.join(' ');
  }

  private renderForeignKey(action: CreateForeignKeyAction): string {
    const columns = action.columns.map(quoteIdentifier).join(', ');
    const references = action.referenceColumns.map(quoteIdentifier).join(', ');
    const parts = [
      `FOREIGN KEY (${columns}) REFERENCES ${quoteIdentifier(action.referenceTable)} (${references})`,
    ];

    if (action.onDelete) parts.push(`ON DELETE ${action.onDelete}`);

    if (action.onUpdate) parts.push(`ON UPDATE ${action.onUpdate}`);

    return parts.join(' ');
  }

  private renderDefault(value: unknown): string {
    // SQLite chỉ nhận literal trần sau DEFAULT; mọi biểu thức phải nằm trong ngoặc.
    if (isRawSql(value)) return `(${value.sql})`;

    if (value === null) return 'NULL';

    if (typeof value === 'number') return String(value);

    // Boolean lưu thành 0/1 vì SQLite không có kiểu boolean riêng.
    if (typeof value === 'boolean') return value ? '1' : '0';

    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;

    throw new Error(`Không dựng được DEFAULT từ giá trị kiểu ${typeof value}`);
  }
}
