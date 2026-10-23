import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env.js';
import { D1GatewayClient, isRetryable } from './d1-gateway.client.js';

const config = {
  get: (key: keyof Env) =>
    ({
      D1_GATEWAY_URL: 'https://gateway.test/',
      D1_GATEWAY_SECRET: 'secret-du-dai-16-ky-tu',
      D1_GATEWAY_TIMEOUT_MS: 1000,
      D1_GATEWAY_RETRIES: 2,
    })[key as string],
} as unknown as ConfigService<Env, true>;

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const errorResponse = (status: number, code: string) =>
  new Response(JSON.stringify({ error: { code, message: code } }), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('isRetryable', () => {
  it.each([
    'select 1',
    '  SELECT * from product',
    'with x as (select 1) select * from x',
    'PRAGMA foreign_keys',
  ])('coi "%s" là lệnh đọc', (sql) => expect(isRetryable(sql)).toBe(true));

  it.each([
    'insert into product (id) values (?)',
    'update product set name = ?',
    'delete from product',
    'create table product (id text)',
  ])('coi "%s" là lệnh ghi', (sql) => expect(isRetryable(sql)).toBe(false));
});

describe('D1GatewayClient', () => {
  let client: D1GatewayClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 0;
    }) as never);
    client = new D1GatewayClient(config);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('gửi SQL kèm header secret và trả về rows', async () => {
    fetchMock.mockResolvedValue(okResponse({ rows: [[1]] }));

    const result = await client.query({
      sql: 'select 1',
      params: [],
      method: 'all',
    });

    expect(result).toEqual({ rows: [[1]] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://gateway.test/query');
    expect(init.headers['x-gateway-secret']).toBe('secret-du-dai-16-ky-tu');
    expect(JSON.parse(init.body)).toEqual({
      sql: 'select 1',
      params: [],
      method: 'all',
    });
  });

  it('thử lại lệnh đọc khi lỗi mạng', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValue(okResponse({ rows: [[1]] }));

    await expect(
      client.query({ sql: 'select 1', params: [], method: 'all' }),
    ).resolves.toEqual({
      rows: [[1]],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('KHÔNG thử lại lệnh ghi — tránh ghi trùng khi request thật ra đã thành công', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));

    await expect(
      client.query({
        sql: 'insert into product (id) values (?)',
        params: ['p1'],
        method: 'run',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('KHÔNG thử lại batch', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));

    await expect(
      client.batch([{ sql: 'select 1', params: [], method: 'all' }]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('không thử lại khi gateway trả lỗi 4xx', async () => {
    fetchMock.mockImplementation(async () =>
      errorResponse(401, 'unauthorized'),
    );

    await expect(
      client.query({ sql: 'select 1', params: [], method: 'all' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('thử lại khi gateway trả 5xx rồi bỏ cuộc sau số lần cấu hình', async () => {
    // Mỗi lần gọi phải là một Response mới: body của Response chỉ đọc được một lần.
    fetchMock.mockImplementation(async () =>
      errorResponse(500, 'query_failed'),
    );

    await expect(
      client.query({ sql: 'select 1', params: [], method: 'all' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('trả null khi get không tìm thấy, không phải mảng rỗng', async () => {
    // Mảng rỗng là truthy nên drizzle sẽ coi như có dòng và vỡ ở cột JSON.
    fetchMock.mockImplementation(async () => okResponse({ rows: null }));

    await expect(
      client.query({ sql: 'select * from products where slug = ?', params: ['x'], method: 'get' }),
    ).resolves.toEqual({ rows: null });
  });

  it('mở gói results của batch thành mảng rows', async () => {
    fetchMock.mockResolvedValue(
      okResponse({ results: [{ rows: [[1]] }, { rows: [] }] }),
    );

    await expect(
      client.batch([
        { sql: 'select 1', params: [], method: 'all' },
        {
          sql: 'insert into product (id) values (?)',
          params: ['p1'],
          method: 'run',
        },
      ]),
    ).resolves.toEqual([{ rows: [[1]] }, { rows: [] }]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://gateway.test/batch');
  });
});
