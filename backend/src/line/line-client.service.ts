import { Injectable, Logger } from '@nestjs/common';
import { messagingApi, validateSignature } from '@line/bot-sdk';

const { MessagingApiClient } = messagingApi;

@Injectable()
export class LineClientService {
  private readonly logger = new Logger(LineClientService.name);
  private client = new MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
  });

  // เช็คว่า request มาจาก LINE จริง (HMAC-SHA256 บน raw body)
  verifySignature(rawBody: Buffer | string, signature: string | undefined): boolean {
    if (!signature) return false;
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    return validateSignature(body, process.env.LINE_CHANNEL_SECRET ?? '', signature);
  }

  // ดึงชื่อคนในกลุ่ม ถ้าพังให้คืน Unknown ไม่ให้ flow ล้ม
  async getGroupMemberName(groupId: string, userId: string): Promise<string> {
    try {
      const profile = await this.client.getGroupMemberProfile(groupId, userId);
      return profile.displayName;
    } catch (e) {
      this.logger.warn(`get profile failed for ${userId}: ${(e as Error).message}`);
      return 'Unknown';
    }
  }

  // ตอบกลับในกลุ่ม (optional confirm) พังก็ปล่อยผ่าน
  async replyText(replyToken: string, text: string): Promise<void> {
    try {
      await this.client.replyMessage({
        replyToken,
        messages: [{ type: 'text', text }],
      });
    } catch (e) {
      this.logger.warn(`reply failed: ${(e as Error).message}`);
    }
  }

  // push เข้ากลุ่มได้ทุกเมื่อ (ไม่ต้องมี replyToken) ใช้แจ้งความคืบหน้างาน
  // พังก็ปล่อยผ่าน — การแจ้งเตือนล้มไม่ควรทำให้ API หลักล้มตาม
  async pushToGroup(groupId: string, text: string): Promise<void> {
    try {
      await this.client.pushMessage({
        to: groupId,
        messages: [{ type: 'text', text }],
      });
    } catch (e) {
      this.logger.warn(`push to ${groupId} failed: ${(e as Error).message}`);
    }
  }
}
