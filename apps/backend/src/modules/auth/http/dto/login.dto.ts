import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@tatvoquatangdanang.vn' })
  @IsEmail({}, { message: 'auth.invalid_credentials' })
  email!: string;

  @ApiProperty({ example: 'admin12345', minLength: 8 })
  @IsString({ message: 'auth.invalid_credentials' })
  @MinLength(8, { message: 'auth.invalid_credentials' })
  password!: string;
}
