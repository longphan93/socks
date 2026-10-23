import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { I18nService } from './common/i18n/i18n.service.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { validationExceptionFactory } from './common/pipes/index.js';
import { Env, NodeEnv, splitOrigins } from './config/env.js';

const API_PREFIX = 'api/v1';
const DOCS_PATH = 'api/docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({
    origin: splitOrigins(config.get('CORS_ORIGINS', { infer: true })),
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost), app.get(I18nService)));

  if (config.get('NODE_ENV', { infer: true }) !== NodeEnv.Production) {
    SwaggerModule.setup(
      DOCS_PATH,
      app,
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle('Socks & Gifts API')
          .setDescription('API cho website bán tất và quà tặng')
          .setVersion('1.0')
          .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'admin')
          .build(),
      ),
    );
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API chạy tại http://localhost:${port}/${API_PREFIX}`);
  logger.log(`Swagger tại http://localhost:${port}/${DOCS_PATH}`);
}

await bootstrap();
