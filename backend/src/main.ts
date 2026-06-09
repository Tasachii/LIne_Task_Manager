import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true ให้ controller เข้าถึง req.rawBody เพื่อตรวจ LINE signature
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({ origin: '*' }); // frontend เรียกข้าม origin ได้

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`backend listening on :${port}`);
}
bootstrap();
