import type { ApiEnvelope } from './types';

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Chi tiết lỗi validate từ backend, nằm ở `meta.errors`. */
    readonly errors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends Omit<
  RequestInit,
  'body' | 'method'
> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  /**
   * JWT của admin. Chỉ khu /admin truyền vào; phía khách hàng không có tài khoản
   * nên mọi request storefront đều ẩn danh.
   */
  token?: string | null;
  /** Đặt false khi cần cả `meta`, ví dụ số liệu phân trang. */
  unwrap?: boolean;
}

/**
 * Gọi API và trả về thẳng `data` đã mở khỏi envelope.
 * Dùng được ở cả Server Component lẫn Client Component.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    searchParams,
    token,
    headers,
    unwrap = true,
    ...rest
  } = options;

  const url = new URL(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    ...rest,
    method,
    headers: {
      accept: 'application/json',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const envelope = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      envelope?.message ?? 'Không kết nối được máy chủ, vui lòng thử lại.',
      toErrorList(envelope?.meta?.errors),
    );
  }

  if (!envelope) {
    throw new ApiError(response.status, 'Máy chủ trả về dữ liệu không hợp lệ.');
  }

  return (unwrap ? envelope.data : envelope) as T;
}

function toErrorList(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.map(String) : undefined;
}
