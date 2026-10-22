import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { D1GatewayClient } from './d1-gateway.client.js';
import { DRIZZLE, drizzleProvider } from './drizzle.provider.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [D1GatewayClient, drizzleProvider],
  exports: [DRIZZLE, D1GatewayClient],
})
export class DatabaseModule {}
