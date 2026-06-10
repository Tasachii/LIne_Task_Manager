import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true ให้ controller เข้าถึง req.rawBody เพื่อตรวจ LINE signature
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // production ตั้ง CORS_ORIGIN เป็นโดเมนบอร์ด เช่น https://board.example.com
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? '*' });
  // ตัด field แปลกปลอมทิ้ง + ตรวจ type ของ body ทุก endpoint ที่มี DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`backend listening on :${port}`);
}
bootstrap();
