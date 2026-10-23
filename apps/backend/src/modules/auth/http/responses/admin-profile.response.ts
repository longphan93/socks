import { ApiProperty } from '@nestjs/swagger';

export class AdminProfileResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;
}
