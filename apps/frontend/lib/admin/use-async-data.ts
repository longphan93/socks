'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tải dữ liệu khi mount và mỗi khi `key` đổi.
 *
 * Trang quản trị phải gọi API từ trình duyệt vì token nằm trong cookie mà chỉ
 * client đọc rồi gắn vào header `Authorization` — Server Component không dựng
 * được request đó nếu không thêm một lớp proxy.
 *
 * `key` là chuỗi mô tả tham số hiện tại (trang, từ khoá). Dùng chuỗi thay vì
 * mảng deps để React kiểm tra được danh sách phụ thuộc.
 */
export function useAsyncData<T>(
  key: string,
  load: () => Promise<T>,
): { data: T | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [token, setToken] = useState(0);

  // Giữ hàm mới nhất mà không đưa nó vào deps — mỗi lần render nó là một hàm
  // khác, đưa vào deps sẽ thành vòng lặp tải vô tận. Gán trong effect chứ
  // không trong thân render, vì ref không được đụng tới lúc render.
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;

    void loadRef.current().then((result) => {
      // Bỏ kết quả về muộn sau khi key đã đổi, tránh ghi đè dữ liệu mới hơn.
      if (!cancelled) setData(result);
    });

    return () => {
      cancelled = true;
    };
  }, [key, token]);

  const reload = useCallback(() => setToken((value) => value + 1), []);

  return { data, reload };
}
