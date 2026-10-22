import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse, Respond } from '../dto/api-response.dto.js';

/** Chuẩn hoá mọi response thành `{ data, message, meta }`. */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(
      map((payload) => {
        // File tải về đi thẳng, không bọc.
        if (payload instanceof StreamableFile) return payload;

        if (payload instanceof Respond) {
          return { data: payload.data as T, message: payload.message, meta: payload.meta };
        }

        return { data: payload, message: null, meta: null };
      }),
    );
  }
}
