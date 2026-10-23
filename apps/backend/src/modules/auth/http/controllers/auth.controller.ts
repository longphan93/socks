import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../../decorators/current-admin.decorator.js';
import { Public } from '../../decorators/public.decorator.js';
import type { AuthenticatedAdminInterface } from '../../interfaces/index.js';
import { AuthService } from '../../services/auth.service.js';
import { LoginDto } from '../dto/index.js';
import { AdminProfileResponse, LoginResponse } from '../responses/index.js';

@ApiTags('Admin - Auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Giới hạn riêng cho login: chặn dò mật khẩu mà không ảnh hưởng route khác.
  @Throttle({ login: {} })
  @ApiOperation({ summary: 'Đăng nhập admin, trả access token' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thông tin admin đang đăng nhập' })
  me(@CurrentAdmin() admin: AuthenticatedAdminInterface): Promise<AdminProfileResponse> {
    return this.authService.profile(admin.id);
  }
}
