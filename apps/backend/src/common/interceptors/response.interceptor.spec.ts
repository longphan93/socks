import { StreamableFile } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { respond } from '../dto/api-response.dto.js';
import { ResponseInterceptor } from './response.interceptor.js';

const context = {} as never;
const handlerFor = <T>(value: T) => ({ handle: () => of(value) });

describe('ResponseInterceptor', () => {
  it('bọc giá trị trần thành { data, message, meta }', async () => {
    const result = await lastValueFrom(
      new ResponseInterceptor().intercept(context, handlerFor({ id: 1 })),
    );

    expect(result).toEqual({ data: { id: 1 }, message: null, meta: null });
  });

  it('giữ nguyên message và meta khi controller dùng respond()', async () => {
    const result = await lastValueFrom(
      new ResponseInterceptor().intercept(
        context,
        handlerFor(
          respond([1, 2], { message: 'Thành công', meta: { total: 2 } }),
        ),
      ),
    );

    expect(result).toEqual({
      data: [1, 2],
      message: 'Thành công',
      meta: { total: 2 },
    });
  });

  it('không bọc null thành undefined', async () => {
    const result = await lastValueFrom(
      new ResponseInterceptor().intercept(context, handlerFor(null)),
    );

    expect(result).toEqual({ data: null, message: null, meta: null });
  });

  it('để file tải về đi thẳng', async () => {
    const file = new StreamableFile(Buffer.from('x'));
    const result = await lastValueFrom(
      new ResponseInterceptor().intercept(context, handlerFor(file)),
    );

    expect(result).toBe(file);
  });
});
