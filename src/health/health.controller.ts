import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { HealthService, HealthStatus } from './health.service.js';

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
