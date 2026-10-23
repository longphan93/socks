/**
 * D1 gateway.
 *
 * NestJS chạy trên Node trong Docker nên không có D1 binding. Worker này đứng
 * giữa: nhận SQL + params qua HTTPS, chạy qua binding `DB`, trả rows về.
 *
 * Rows luôn trả về dạng mảng giá trị (không phải object) vì phía NestJS dùng
 * `drizzle-orm/sqlite-proxy`, driver này tự map cột theo thứ tự trong SQL.
 */

export interface Env {
  DB: D1Database;
  GATEWAY_SECRET: string;
  /** Chỉ bật khi dev local (`wrangler dev` phục vụ qua http). */
  ALLOW_INSECURE?: string;
}

type SqlMethod = 'run' | 'all' | 'values' | 'get';

interface QueryRequest {
  sql: string;
  params?: unknown[];
  method?: SqlMethod;
}

interface BatchRequest {
  queries: QueryRequest[];
}

const SQL_METHODS: readonly SqlMethod[] = ['run', 'all', 'values', 'get'];

class GatewayError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      assertSecureTransport(url, env);
      assertSecret(request, env);

      if (request.method !== 'POST') {
        throw new GatewayError(405, 'method_not_allowed', 'Chỉ nhận POST');
      }

      switch (url.pathname) {
        case '/query':
          return json(
            await handleQuery(env, await readJson<QueryRequest>(request)),
          );
        case '/batch':
          return json(
            await handleBatch(env, await readJson<BatchRequest>(request)),
          );
        default:
          throw new GatewayError(
            404,
            'not_found',
            `Không có route ${url.pathname}`,
          );
      }
    } catch (error) {
      return handleError(error, url.pathname);
    }
  },
} satisfies ExportedHandler<Env>;

/* ---------------------------------------------------------------- handlers */

async function handleQuery(
  env: Env,
  body: QueryRequest,
): Promise<{ rows: unknown[] }> {
  const { sql, params, method } = normalizeQuery(body, 'body');
  const statement = env.DB.prepare(sql).bind(...params);

  if (method === 'run') {
    await statement.run();
    return { rows: [] };
  }

  // `.raw()` trả mảng giá trị theo đúng thứ tự cột — đúng thứ sqlite-proxy cần.
  const rows = await statement.raw();
  return { rows: method === 'get' ? (rows[0] ?? []) : rows };
}

async function handleBatch(
  env: Env,
  body: BatchRequest,
): Promise<{ results: { rows: unknown[] }[] }> {
  if (!Array.isArray(body?.queries) || body.queries.length === 0) {
    throw new GatewayError(
      400,
      'invalid_body',
      '`queries` phải là mảng không rỗng',
    );
  }

  const queries = body.queries.map((query, index) =>
    normalizeQuery(query, `queries[${index}]`),
  );
  const batch = await env.DB.batch(
    queries.map((query) => env.DB.prepare(query.sql).bind(...query.params)),
  );

  return {
    results: batch.map((result, index) => {
      if (queries[index].method === 'run') return { rows: [] };

      // D1 `batch()` không hỗ trợ `.raw()`, nên tự đổi object -> mảng giá trị.
      // D1 giữ nguyên thứ tự cột trong key của object nên thứ tự vẫn khớp SQL.
      const rows = (result.results ?? []).map((row) =>
        Object.values(row as object),
      );
      return { rows: queries[index].method === 'get' ? (rows[0] ?? []) : rows };
    }),
  };
}

/* ------------------------------------------------------------------ helpers */

function normalizeQuery(
  query: QueryRequest,
  path: string,
): Required<QueryRequest> {
  if (!query || typeof query.sql !== 'string' || query.sql.trim() === '') {
    throw new GatewayError(
      400,
      'invalid_body',
      `${path}.sql phải là chuỗi SQL`,
    );
  }

  const params = query.params ?? [];
  if (!Array.isArray(params)) {
    throw new GatewayError(400, 'invalid_body', `${path}.params phải là mảng`);
  }

  const method = query.method ?? 'all';
  if (!SQL_METHODS.includes(method)) {
    throw new GatewayError(
      400,
      'invalid_body',
      `${path}.method phải thuộc ${SQL_METHODS.join(' | ')}`,
    );
  }

  return { sql: query.sql, params, method };
}

function assertSecureTransport(url: URL, env: Env): void {
  if (url.protocol === 'https:') return;
  if (env.ALLOW_INSECURE === 'true') return;
  throw new GatewayError(
    403,
    'insecure_transport',
    'Gateway chỉ nhận request HTTPS',
  );
}

function assertSecret(request: Request, env: Env): void {
  if (!env.GATEWAY_SECRET) {
    throw new GatewayError(
      500,
      'missing_secret',
      'Worker chưa cấu hình GATEWAY_SECRET',
    );
  }
  if (
    !timingSafeEqual(
      request.headers.get('x-gateway-secret') ?? '',
      env.GATEWAY_SECRET,
    )
  ) {
    throw new GatewayError(
      401,
      'unauthorized',
      'Sai hoặc thiếu header x-gateway-secret',
    );
  }
}

/** So sánh không phụ thuộc vị trí ký tự khác nhau, tránh lộ secret qua thời gian phản hồi. */
function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new GatewayError(400, 'invalid_json', 'Body không phải JSON hợp lệ');
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function handleError(error: unknown, path: string): Response {
  if (error instanceof GatewayError) {
    // 401/403 log ở mức cảnh báo để phát hiện request lạ.
    console.warn(`[d1-gateway] ${path} ${error.code}: ${error.message}`);
    return json(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(`[d1-gateway] ${path} query_failed: ${message}`);
  return json({ error: { code: 'query_failed', message } }, 500);
}
