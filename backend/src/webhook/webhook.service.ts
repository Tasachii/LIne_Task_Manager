import { Injectable, Logger } from '@nestjs/common';
import { webhook } from '@line/bot-sdk';
import { LineClientService } from '../line/line-client.service';
import { TasksService } from '../tasks/tasks.service';
import { TasksRepository } from '../tasks/tasks.repository';
import { TaskExtractionService } from '../tasks/task-extraction.service';
import { NewTaskInput } from '../tasks/dto/task.types';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly line: LineClientService,
    private readonly tasks: TasksService,
    private readonly repo: TasksRepository,
    private readonly extractor: TaskExtractionService,
  ) {}

  async handleEvents(events: webhook.Event[]): Promise<void> {
    for (const event of events) {
      try {
        await this.handleOne(event);
      } catch (e) {
        // 1 event พังไม่ควรทำให้ทั้ง batch พัง
        this.logger.error(`handle event failed: ${(e as Error).message}`);
      }
    }
  }

  private async handleOne(event: webhook.Event): Promise<void> {
    // สนใจเฉพาะข้อความ text ที่มาจากกลุ่ม
    if (event.type !== 'message') return;
    if (event.message.type !== 'text') return;
    if (event.source?.type !== 'group') return;

    const groupId = event.source.groupId;
    const userId = event.source.userId ?? 'unknown';
    const messageId = event.message.id;
    const text = event.message.text;

    // กันซ้ำตอน LINE retry webhook
    if (await this.repo.messageExists(messageId)) {
      this.logger.log(`skip duplicate message ${messageId}`);
      return;
    }
    await this.repo.saveMessage(messageId, groupId, userId, text);

    const extracted = this.extractor.extract(text);
    if (extracted.length === 0) return; // ไม่ใช่งาน ข้าม

    // ดึงชื่อคนสั่งงาน แล้ว upsert
    const displayName = await this.line.getGroupMemberName(groupId, userId);
    await this.repo.upsertUser(userId, displayName);

    const inputs: NewTaskInput[] = extracted.map((t) => ({
      title: t.title,
      description: t.description,
      groupId,
      sourceMessageId: messageId,
      createdBy: userId,
    }));
    const created = await this.tasks.createMany(inputs);

    // confirm กลับในกลุ่ม (optional)
    if (event.replyToken) {
      await this.line.replyText(event.replyToken, `รับเข้า Todo แล้ว ${created.length} งาน ✅`);
    }
  }
}
