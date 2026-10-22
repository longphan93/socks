import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from './../src/app.module.js';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

// Biến môi trường cho test nằm ở vitest.config.e2e.ts.
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health trả envelope { data, message, meta }', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toEqual({
      data: {
        status: 'degraded',
        database: 'down',
        uptimeSeconds: expect.any(Number),
      },
      message: null,
      meta: null,
    });
  });

  it('route không tồn tại cũng trả đúng envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/khong-ton-tai')
      .expect(404);

    expect(response.body.data).toBeNull();
    expect(response.body.meta).toMatchObject({
      statusCode: 404,
      path: '/api/v1/khong-ton-tai',
    });
  });

  it('API chỉ phục vụ dưới prefix /api/v1', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });
});
