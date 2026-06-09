import { Injectable } from '@nestjs/common';

export interface ExtractedTask {
  title: string;
  description: string;
}

@Injectable()
export class TaskExtractionService {
  private keyword = process.env.TASK_KEYWORD ?? '/task';

  // MVP: ข้อความต้องขึ้นต้นด้วย keyword ถึงจะถือเป็นงาน
  // หลายบรรทัด = หลาย task (FR-2.2)
  extract(message: string): ExtractedTask[] {
    const trimmed = message.trim();
    if (!trimmed.toLowerCase().startsWith(this.keyword.toLowerCase())) {
      return [];
    }

    const body = trimmed.slice(this.keyword.length).trim();
    if (!body) return [];

    return body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ({
        title: line.length > 60 ? line.slice(0, 60) + '…' : line,
        description: line,
      }));
  }
}
