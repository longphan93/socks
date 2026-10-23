import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiResponse } from '../dto/api-response.dto.js';

/** Lỗi cũng trả về `{ data, message, meta }` để client chỉ phải xử lý một hình dạng. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = describe(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        message,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiResponse<null> = {
      data: null,
      message,
      meta: {
        statusCode: status,
        path: httpAdapter.getRequestUrl(request),
        timestamp: new Date().toISOString(),
        ...(errors ? { errors } : {}),
      },
    };

    httpAdapter.reply(ctx.getResponse(), body, status);
  }
}

function describe(
  exception: unknown,
  status: number,
): { message: string; errors?: unknown } {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();

    if (typeof response === 'string') return { message: response };

    if (typeof response === 'object' && response !== null) {
      const payload = response as { message?: unknown; error?: unknown };

      // ValidationPipe trả message dạng mảng chuỗi lỗi.
      if (Array.isArray(payload.message)) {
        return {
          message: 'Dữ liệu gửi lên không hợp lệ',
          errors: payload.message,
        };
      }
      if (typeof payload.message === 'string')
        return { message: payload.message };
      if (typeof payload.error === 'string') return { message: payload.error };
    }

    return { message: exception.message };
  }

  // Không lộ chi tiết lỗi nội bộ ra ngoài.
  return {
    message:
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Có lỗi xảy ra, vui lòng thử lại sau'
        : String(exception),
  };
}
