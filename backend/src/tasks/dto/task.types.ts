import { IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export type TaskStatus = 'todo' | 'in_process' | 'test' | 'done';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_process', 'test', 'done'];

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  source_message_id: string | null;
  group_id: string;
  created_by: string | null;
  assignee_id: string | null;
  assignee_name?: string | null; // มาจาก join users
  priority: TaskPriority | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// ข้อมูลที่ extractor คายออกมา ก่อนกลายเป็น row จริง
export interface NewTaskInput {
  title: string;
  description: string;
  groupId: string;
  sourceMessageId: string;
  createdBy: string;
  priority?: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
}

// DTO เป็น class เพื่อให้ ValidationPipe ตรวจ payload จริงก่อนถึง service
export class UpdateStatusDto {
  @IsIn(TASK_STATUSES)
  status: TaskStatus;
}

export class MoveDto {
  @IsIn(TASK_STATUSES)
  status: TaskStatus;

  @IsInt()
  @Min(0)
  index: number; // ตำแหน่งใหม่ในคอลัมน์ปลายทาง
}

export class AssignDto {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsOptional()
  @IsString()
  displayName?: string; // เผื่อสมาชิกบนบอร์ดที่ยังไม่มีใน users
}
