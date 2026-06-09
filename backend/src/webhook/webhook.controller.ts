import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { webhook } from '@line/bot-sdk';
import { LineClientService } from '../line/line-client.service';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly line: LineClientService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post()
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-line-signature') signature: string,
  ) {
    // ต้องใช้ raw body ตรวจ signature (HMAC คิดจาก byte ดิบ)
    const raw = req.rawBody;
    if (!raw || !this.line.verifySignature(raw, signature)) {
      throw new BadRequestException('invalid signature');
    }

    const body = req.body as { events?: webhook.Event[] };
    // ตอบ LINE 200 เร็วๆ แล้ว process แบบ async (กัน LINE retry)
    void this.webhookService.handleEvents(body.events ?? []);
    return { ok: true };
  }
}
