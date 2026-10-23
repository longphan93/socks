# Migrations

Migration viết tay bằng DSL của `@longphan93/nestjs-migration`, chạy trên D1 qua
`D1GatewayExecutor`. Không sinh tự động từ schema.

## Tên file

`<epoch-ms>-<TenPascalCase>.ts`, class trong file là `<TenPascalCase><epoch-ms>`.
Lấy số bằng `node -e "console.log(Date.now())"` — dùng nguyên giá trị đồng hồ
thật, không làm tròn, không đặt số tương lai để ép thứ tự sắp xếp. Viết nhiều
file một lúc thì đọc đồng hồ một lần cho mỗi file.

## Một bảng một file

Mỗi file tạo hoặc sửa đúng một bảng; index và khoá ngoại của bảng nào nằm cùng
file tạo bảng đó. Seed dữ liệu là file riêng, không phải thay đổi schema. Nhờ
vậy `ls` chính là nhật ký schema, và quay lui được từng bảng một.

## Khuôn

```ts
import { AbstractD1Migration } from '../abstract-d1.migration.js';
import { rawSql } from '../helpers/raw-sql.helper.js';

export class CreateCategoriesTable1792690615437 extends AbstractD1Migration {
  async execute(): Promise<void> {
    await this.createTable('categories', (table) => {
      table.column('id').uuid().primary();
      table.column('slug').string().unique();
      table.column('group').string().index();
      table.column('sort_order').integer().default(0);
      table.column('created_at').timestamp().default(rawSql("datetime('now')"));
    });
  }

  async rollback(): Promise<void> {
    await this.dropTable('categories');
  }
}
```

## Giới hạn của SQLite phải nhớ

- **Khoá chính và khoá ngoại chỉ khai báo được lúc `CREATE TABLE`.** Gọi
  `.foreign()` hay `primaryColumns()` trên bảng đã tồn tại sẽ bị executor chặn
  kèm thông báo. Muốn đổi thì tạo bảng mới rồi chép dữ liệu sang.
- **Cột thêm vào bảng đã có dữ liệu phải `nullable()` hoặc có `default()`** —
  SQLite không biết điền gì cho các dòng cũ.
- **`AUTOINCREMENT` chỉ chạy trên `integer().primary()`.**
- Default là biểu thức thì bọc bằng `rawSql(...)`; executor tự thêm ngoặc.

## Lệnh

```bash
npm run build && npm run db:migrate          # chạy migration chưa áp dụng
npm run build && npm run db:migrate:revert   # quay lui migration mới nhất
```

`npm run start:prod` chạy `db:migrate` trước; migrate hỏng thì server không
khởi động. Mọi câu lệnh của một migration đi cùng dòng ghi sổ trong một D1
batch nguyên tử, nên migration hỏng giữa chừng không để lại gì.
