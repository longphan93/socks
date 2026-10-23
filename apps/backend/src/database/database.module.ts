import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { D1GatewayClient } from './d1-gateway.client.js';
import { DRIZZLE, drizzleProvider } from './drizzle.provider.js';
import { MigrationRunnerService } from './services/migration-runner.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [D1GatewayClient, drizzleProvider, MigrationRunnerService],
  exports: [DRIZZLE, D1GatewayClient, MigrationRunnerService],
})
export class DatabaseModule {}
