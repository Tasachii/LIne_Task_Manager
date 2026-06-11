import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true exposes req.rawBody so the controller can verify the LINE signature.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // In production, set CORS_ORIGIN to the board domain, e.g. https://board.example.com.
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? '*' });
  // Strip unknown fields and validate body types on every endpoint that has a DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`backend listening on :${port}`);
}
bootstrap();
