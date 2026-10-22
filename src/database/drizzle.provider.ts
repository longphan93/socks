import { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import { D1GatewayClient } from './d1-gateway.client.js';
import * as schema from './schema/index.js';

export const DRIZZLE = Symbol('DRIZZLE');

export type Database = SqliteRemoteDatabase<typeof schema>;

/**
 * Drizzle nói chuyện với D1 qua `sqlite-proxy`: nó sinh SQL rồi đưa cho callback,
 * callback đẩy sang Worker gateway. Không có transaction tương tác, dùng
 * `db.batch([...])` khi cần nhiều câu lệnh chạy nguyên tử.
 */
export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [D1GatewayClient],
  useFactory: (gateway: D1GatewayClient): Database =>
    drizzle<typeof schema>(
      async (sql, params, method) => gateway.query({ sql, params, method }),
      async (queries) => gateway.batch(queries.map((query) => ({ ...query }))),
      { schema, casing: 'snake_case' },
    ),
};
