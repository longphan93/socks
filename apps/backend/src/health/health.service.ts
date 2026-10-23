import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../database/drizzle.provider.js';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'ok' | 'down';
  uptimeSeconds: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async check(): Promise<HealthStatus> {
    const database = await this.pingDatabase();

    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  /** Đi hết đường NestJS -> gateway -> D1 nên đủ để biết chuỗi kết nối còn sống. */
  private async pingDatabase(): Promise<'ok' | 'down'> {
    try {
      await this.db.get<[number]>(sql`select 1`);
      return 'ok';
    } catch (error) {
      this.logger.error(
        `Không ping được D1: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 'down';
    }
  }
}
