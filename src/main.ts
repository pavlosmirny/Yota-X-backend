import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Включаем CORS для фронтенда
  app.enableCors({
    origin: '*', // В продакшене заменить на реальные домены
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Глобальная валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет все поля, которые не определены в DTO
      transform: true, // Автоматически преобразует типы
      forbidNonWhitelisted: true, // Запрещает поля, не описанные в DTO
    }),
  );

  // Глобальный префикс API
  app.setGlobalPrefix('api/v1');

  // Настройка Swagger для всех ресурсов
  const config = new DocumentBuilder()
    .setTitle('Dev Company API')
    .setDescription('API documentation for web development and DevOps company')
    .setVersion('1.0')
    .addTag('positions', 'Job positions management')
    .addTag('articles', 'Blog articles management')
    .addTag('projects', 'Company projects')
    .addTag('services', 'Company services')
    .addBearerAuth() // Если планируете использовать JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // API документация будет доступна по /docs

  // Запуск приложения
  const port = process.env.PORT ?? 5002;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(
      `Swagger documentation is available at: http://localhost:${port}/docs`,
    );
  });
}
bootstrap();
