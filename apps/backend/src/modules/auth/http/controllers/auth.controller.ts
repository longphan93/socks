import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Đăng nhập admin, trả access token' })
  // Chặn dò mật khẩu bằng cách đếm lần SAI theo IP, xem LoginAttemptService.
  login(@Body() dto: LoginDto, @Ip() ip: string): Promise<LoginResponse> {
    return this.authService.login(dto, ip);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thông tin admin đang đăng nhập' })
  me(@CurrentAdmin() admin: AuthenticatedAdminInterface): Promise<AdminProfileResponse> {
    return this.authService.profile(admin.id);
  }
}
