const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

/** Tiền được lưu dưới dạng số nguyên VND, không có phần thập phân. */
export function formatVnd(amount: number): string {
  return vndFormatter.format(Math.round(amount));
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDate(value: string | Date): string {
  return dateFormatter.format(
    typeof value === 'string' ? new Date(value) : value,
  );
}
