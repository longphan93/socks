import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.js';

export type SqlMethod = 'run' | 'all' | 'values' | 'get';

export interface SqlQuery {
  sql: string;
  params: unknown[];
  method: SqlMethod;
}

/** Câu lệnh chỉ đọc mới được thử lại — thử lại lệnh ghi có thể tạo bản ghi trùng. */
const READ_ONLY_SQL = /^\s*(?:select|with|pragma|explain)\b/i;

/** Gọi Worker d1-gateway. Mỗi lần gọi là một request HTTPS, không phải kết nối DB. */
@Injectable()
export class D1GatewayClient {
  private readonly logger = new Logger(D1GatewayClient.name);
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor(config: ConfigService<Env, true>) {
    this.baseUrl = config.get('D1_GATEWAY_URL', { infer: true }).replace(/\/+$/, '');
    this.secret = config.get('D1_GATEWAY_SECRET', { infer: true });
    this.timeoutMs = config.get('D1_GATEWAY_TIMEOUT_MS', { infer: true });
    this.retries = config.get('D1_GATEWAY_RETRIES', { infer: true });
  }

  async query(query: SqlQuery): Promise<{ rows: unknown[] }> {
    return this.send<{ rows: unknown[] }>('/query', query, isRetryable(query.sql));
  }

  /**
   * D1 không có transaction tương tác; batch là cách duy nhất để nhiều câu lệnh
   * chạy nguyên tử. Không bao giờ thử lại vì batch gần như luôn có lệnh ghi.
   */
  async batch(queries: SqlQuery[]): Promise<{ rows: unknown[] }[]> {
    const response = await this.send<{ results: { rows: unknown[] }[] }>(
      '/batch',
      { queries },
      false,
    );
    return response.results;
  }

  private async send<T>(path: string, body: unknown, retryable: boolean): Promise<T> {
    const attempts = retryable ? this.retries + 1 : 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.sendOnce<T>(path, body);
      } catch (error) {
        lastError = error;

        // Gateway đã trả lời và từ chối (SQL sai, sai secret...) thì thử lại vô ích.
        if (error instanceof GatewayResponseError && error.status < 500) throw error.toHttp();

        if (attempt < attempts) {
          const backoffMs = 100 * 2 ** (attempt - 1);
          this.logger.warn(
            `Gọi ${path} lỗi (lần ${attempt}/${attempts}), thử lại sau ${backoffMs}ms: ${messageOf(error)}`,
          );
          await sleep(backoffMs);
        }
      }
    }

    this.logger.error(`Gọi ${path} thất bại sau ${attempts} lần: ${messageOf(lastError)}`);
    if (lastError instanceof GatewayResponseError) throw lastError.toHttp();
    throw new ServiceUnavailableException('Không kết nối được cơ sở dữ liệu');
  }

  private async sendOnce<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-gateway-secret': this.secret,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: { code?: string; message?: string };
      } | null;
      throw new GatewayResponseError(
        response.status,
        payload?.error?.code ?? 'gateway_error',
        payload?.error?.message ?? response.statusText,
      );
    }

    return (await response.json()) as T;
  }
}

class GatewayResponseError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(`[${code}] ${message}`);
  }

  toHttp(): ServiceUnavailableException {
    // Lỗi gateway là lỗi hạ tầng của chúng ta, không phải lỗi của client.
    return new ServiceUnavailableException('Không truy vấn được cơ sở dữ liệu');
  }
}

export function isRetryable(sql: string): boolean {
  return READ_ONLY_SQL.test(sql);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
