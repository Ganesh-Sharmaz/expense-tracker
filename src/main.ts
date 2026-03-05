import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix — all routes are /api/...
  app.setGlobalPrefix('api');

  // Validation: strip unknown fields, auto-cast types, reject unknown props
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Every success response: { success: true, data: ..., timestamp: ... }
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Every error response: { success: false, error: ..., path: ..., timestamp: ... }
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT || 3000);
  console.log(
    `\n🚀 Expense Tracker running on http://localhost:${process.env.PORT || 3000}/api\n`,
  );
}

bootstrap();
