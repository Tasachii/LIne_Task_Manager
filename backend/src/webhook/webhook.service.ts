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
        // One failing event must not abort the whole batch.
        this.logger.error(`handle event failed: ${(e as Error).message}`);
      }
    }
  }

  private async handleOne(event: webhook.Event): Promise<void> {
    // Bot was just added to a group — send a greeting and usage instructions.
    if (event.type === 'join' && event.replyToken) {
      const keyword = process.env.TASK_KEYWORD ?? '/task';
      await this.line.replyText(
        event.replyToken,
        `สวัสดีครับ ผมคือ Task Manager Bot 🤖\n` +
          `พิมพ์ข้อความขึ้นต้นด้วย "${keyword}" เพื่อสร้างงานเข้าบอร์ด เช่น\n\n` +
          `${keyword} แก้ปุ่ม login หน้าแรก\nเปลี่ยนสีปุ่มเป็นสีเขียว\n\n` +
          `(1 บรรทัด = 1 งาน) แล้วผมจะแจ้งความคืบหน้าในกลุ่มนี้เมื่อสถานะงานเปลี่ยนครับ`,
      );
      return;
    }

    // Only process text messages from group chats.
    if (event.type !== 'message') return;
    if (event.message.type !== 'text') return;
    if (event.source?.type !== 'group') return;

    const groupId = event.source.groupId;
    const userId = event.source.userId ?? 'unknown';
    const messageId = event.message.id;
    const text = event.message.text;

    // Deduplicate on LINE webhook retries.
    if (await this.repo.messageExists(messageId)) {
      this.logger.log(`skip duplicate message ${messageId}`);
      return;
    }
    await this.repo.saveMessage(messageId, groupId, userId, text);

    const extracted = await this.extractor.extract(text);
    if (extracted.length === 0) return; // not a task message, skip

    // Fetch the requester's display name then upsert into users.
    const displayName = await this.line.getGroupMemberName(groupId, userId);
    await this.repo.upsertUser(userId, displayName);

    const inputs: NewTaskInput[] = extracted.map((t) => ({
      title: t.title,
      description: t.description,
      groupId,
      sourceMessageId: messageId,
      createdBy: userId,
      priority: t.priority,
      dueDate: t.dueDate,
    }));
    const created = await this.tasks.createMany(inputs);

    // Send confirmation back to the group (optional).
    if (event.replyToken) {
      await this.line.replyText(event.replyToken, `รับเข้า Todo แล้ว ${created.length} งาน ✅`);
    }
  }
}
