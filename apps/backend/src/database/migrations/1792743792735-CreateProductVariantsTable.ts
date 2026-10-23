import { AbstractD1Migration } from '../abstract-d1.migration.js';

export class CreateProductVariantsTable1792743792735 extends AbstractD1Migration {
  async execute(): Promise<void> {
    // Viết thẳng SQL vì DSL chưa có ràng buộc CHECK, mà CHECK (stock >= 0)
    // chính là thứ làm batch trừ kho rollback khi hàng không đủ — D1 không có
    // transaction tương tác nên không thể kiểm tồn rồi trừ trong hai bước.
    await this.runSQL(`CREATE TABLE IF NOT EXISTS "product_variants" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "product_id" TEXT NOT NULL,
      "sku" TEXT NOT NULL UNIQUE,
      "size_id" TEXT NOT NULL,
      "color_id" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "stock" INTEGER NOT NULL DEFAULT 0 CHECK ("stock" >= 0),
      "is_active" INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY ("product_id") REFERENCES "products" ("id"),
      FOREIGN KEY ("size_id") REFERENCES "variant_options" ("id"),
      FOREIGN KEY ("color_id") REFERENCES "variant_options" ("id")
    )`);

    await this.runSQL(
      'CREATE INDEX IF NOT EXISTS "product_variants_product_idx" ON "product_variants" ("product_id")',
    );
  }

  async rollback(): Promise<void> {
    await this.dropTable('product_variants');
  }
}
