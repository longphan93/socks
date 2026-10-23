import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { VariantOptionKindEnum } from '../../common/enums/index.js';
import { bool, pk, translated } from './columns.helper.js';

/**
 * Danh sách size và màu do admin quản lý.
 *
 * Biến thể tham chiếu vào đây thay vì lưu text tự do, để bộ lọc ở Phase 4
 * không tách "Xanh navy" và "xanh Navy" thành hai giá trị khác nhau.
 */
export const variantOptions = sqliteTable(
  'variant_options',
  {
    id: pk(),
    kind: text().$type<VariantOptionKindEnum>().notNull(),
    /** Dùng trong URL filter: "m", "navy". */
    value: text().notNull(),
    label: translated().notNull(),
    /** Chỉ dùng khi kind = COLOR, để giao diện vẽ ô màu. */
    hexColor: text(),
    sortOrder: integer().notNull().default(0),
    isActive: bool().notNull().default(true),
  },
  (table) => [uniqueIndex('variant_options_kind_value_idx').on(table.kind, table.value)],
);
