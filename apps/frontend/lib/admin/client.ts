'use client';

import { ApiError, apiFetch, type ApiRequestOptions } from '@/lib/api/client';
import { clearSession, readToken } from './auth';

/**
 * Gọi API admin: tự gắn token và tự đá về trang đăng nhập khi token hết hạn.
 *
 * Xử lý 401 tập trung ở đây thay vì mỗi trang tự bắt, nếu không sẽ có trang
 * quên và người dùng thấy lỗi lạ thay vì được đưa về đăng nhập.
 */
export async function adminFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  try {
    return await apiFetch<T>(path, { ...options, token: readToken() });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearSession();
      // Không dùng useRouter được: đây không phải component. Tải lại cả trang
      // cũng là chủ ý — xoá sạch dữ liệu admin còn trong bộ nhớ.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    }

    throw error;
  }
}
