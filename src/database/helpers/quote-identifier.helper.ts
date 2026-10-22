/** Bọc tên bảng/cột trong dấu nháy kép của SQLite, nhân đôi nháy có sẵn. */
export function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
