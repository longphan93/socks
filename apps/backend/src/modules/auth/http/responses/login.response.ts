import { ApiProperty } from '@nestjs/swagger';
import { AdminProfileResponse } from './admin-profile.response.js';

export class LoginResponse {
  @ApiProperty({ description: 'Bearer token gắn vào header Authorization' })
  accessToken!: string;

  @ApiProperty({ description: 'Thời hạn token, định dạng của jsonwebtoken' })
  expiresIn!: string;

  @ApiProperty({ type: AdminProfileResponse })
  admin!: AdminProfileResponse;
}
