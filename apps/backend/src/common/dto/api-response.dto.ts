import { ApiProperty } from '@nestjs/swagger';

/** Mọi response của API đều có hình dạng này. */
export interface ApiResponse<T> {
  data: T;
  message: string | null;
  meta: Record<string, unknown> | null;
}

/**
 * Controller trả giá trị trần thì interceptor tự bọc thành `{ data, message, meta }`.
 * Khi cần kèm message hoặc meta (phân trang...) thì trả về `respond(...)`.
 */
export class Respond<T> {
  constructor(
    readonly data: T,
    readonly message: string | null = null,
    readonly meta: Record<string, unknown> | null = null,
  ) {}
}

export function respond<T>(
  data: T,
  options: { message?: string; meta?: Record<string, unknown> } = {},
): Respond<T> {
  return new Respond(data, options.message ?? null, options.meta ?? null);
}

/** Dùng cho `@ApiOkResponse` trong Swagger. */
export class ApiResponseDto<T = unknown> {
  @ApiProperty({ description: 'Dữ liệu trả về, null khi lỗi' })
  data!: T | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Thông báo cho người dùng',
  })
  message!: string | null;

  @ApiProperty({
    type: Object,
    nullable: true,
    description: 'Thông tin phụ: phân trang, mã lỗi, chi tiết lỗi validate',
  })
  meta!: Record<string, unknown> | null;
}
