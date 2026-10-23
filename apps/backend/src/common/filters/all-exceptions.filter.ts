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
import { I18nService } from '../i18n/i18n.service.js';

/** Lỗi cũng trả về `{ data, message, meta }` để client chỉ phải xử lý một hình dạng. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly i18n: I18nService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const locale = this.i18n.resolveLocale(request?.headers?.['accept-language']);
    const { message, errors } = describe(exception, status);

    // Lỗi từng trường cũng là i18n key; dịch luôn để giao diện gắn thẳng vào
    // ô nhập, khỏi phải giữ bản sao của cùng bộ key bên frontend.
    const translatedErrors = Array.isArray(errors)
      ? errors.map((error) => this.i18n.translate(String(error), locale))
      : errors;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    }

    const body: ApiResponse<null> = {
      data: null,
      // Message trong code là i18n key; dịch ở đây là chỗ duy nhất biết ngôn ngữ
      // của request.
      message: this.i18n.translate(message, locale),
      meta: {
        statusCode: status,
        path: httpAdapter.getRequestUrl(request),
        timestamp: new Date().toISOString(),
        ...(translatedErrors ? { errors: translatedErrors } : {}),
      },
    };

    httpAdapter.reply(ctx.getResponse(), body, status);
  }
}

function describe(exception: unknown, status: number): { message: string; errors?: unknown } {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();

    if (typeof response === 'string') return { message: response };

    if (typeof response === 'object' && response !== null) {
      const payload = response as { message?: unknown; error?: unknown };

      // ValidationPipe trả message dạng mảng key lỗi của từng trường.
      if (Array.isArray(payload.message)) {
        return { message: 'common.validation_failed', errors: payload.message };
      }

      if (typeof payload.message === 'string') return { message: payload.message };

      if (typeof payload.error === 'string') return { message: payload.error };
    }

    return { message: exception.message };
  }

  // Không lộ chi tiết lỗi nội bộ ra ngoài.
  return {
    message:
      status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'common.internal_error' : String(exception),
  };
}
