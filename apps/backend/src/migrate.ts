import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MigrationRunnerService } from './database/services/migration-runner.service.js';

/**
 * Chạy migration rồi thoát. `start:prod` gọi file này trước `node dist/main`,
 * nên migrate hỏng là server không khởi động.
 *
 *   node dist/migrate            chạy migration chưa áp dụng
 *   node dist/migrate revert     quay lui migration mới nhất
 */
async function migrate() {
  const logger = new Logger('Migrate');
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: false });

  try {
    const runner = app.get(MigrationRunnerService);

    if (process.argv[2] === 'revert') {
      await runner.revert();
    } else {
      await runner.run();
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    await app.close();
    process.exit(1);
  }

  await app.close();
}

await migrate();
