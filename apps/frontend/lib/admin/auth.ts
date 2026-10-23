'use client';

import type { AdminProfile } from '@/lib/api/types';

/**
 * Token admin lưu trong cookie chứ không phải localStorage.
 *
 * Middleware chạy phía server nên không đọc được localStorage; muốn chặn
 * `/admin/*` trước khi trang kịp render thì token phải nằm ở cookie.
 *
 * Cookie KHÔNG đặt httpOnly vì trình duyệt phải đọc được để gắn vào header
 * `Authorization` khi gọi API ở cổng khác. Đánh đổi: script lạ chèn được vào
 * trang sẽ đọc được token. Chấp nhận ở MVP; muốn siết thì cho Next proxy API
 * qua route handler và chuyển cookie sang httpOnly.
 */
export const ADMIN_TOKEN_COOKIE = 'socks_admin_token';

const PROFILE_KEY = 'socks_admin_profile';

export function saveSession(token: string, profile: AdminProfile): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  // 7 ngày, khớp JWT_EXPIRES_IN của backend.
  document.cookie = `${ADMIN_TOKEN_COOKIE}=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Chế độ riêng tư chặn localStorage: mất tên hiển thị thôi, không chặn đăng nhập.
  }
}

export function clearSession(): void {
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;

  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Không có gì để dọn.
  }
}

export function readToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_TOKEN_COOKIE}=([^;]*)`));

  return match ? decodeURIComponent(match[1]) : null;
}

export function readProfile(): AdminProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);

    return raw ? (JSON.parse(raw) as AdminProfile) : null;
  } catch {
    return null;
  }
}
