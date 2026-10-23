import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../modules/auth/decorators/public.decorator.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { HealthService, HealthStatus } from './health.service.js';

@Public()
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    type: ApiResponseDto,
    description: 'Trạng thái service và kết nối tới D1 qua gateway',
  })
  check(): Promise<HealthStatus> {
    return this.healthService.check();
  }
}
