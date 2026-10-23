import { Global, Module } from '@nestjs/common';
import { MemoryCacheService } from './memory-cache.service.js';

@Global()
@Module({
  providers: [MemoryCacheService],
  exports: [MemoryCacheService],
})
export class CacheModule {}
