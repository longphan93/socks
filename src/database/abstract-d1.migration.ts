import { BaseMigration } from '@longphan93/nestjs-migration';
import { D1GatewayExecutor } from './executors/d1-gateway.executor.js';

/**
 * Lớp cha của mọi migration trong dự án, tương đương `TypeOrmMigration` của
 * thư viện nhưng chạy trên D1.
 *
 * Migration chỉ mô tả thay đổi; `MigrationRunnerService` lo việc gom câu lệnh
 * và gửi sang gateway.
 */
export abstract class AbstractD1Migration extends BaseMigration {
  up(executor: D1GatewayExecutor): Promise<void> {
    this.initialize(executor);

    return this.execute();
  }

  down(executor: D1GatewayExecutor): Promise<void> {
    this.initialize(executor);

    return this.rollback();
  }
}
