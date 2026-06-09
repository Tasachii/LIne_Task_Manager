export type TaskStatus = 'todo' | 'in_process' | 'test' | 'done';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_process', 'test', 'done'];

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
  priority: string | null;
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
}

export interface UpdateStatusDto {
  status: TaskStatus;
}

export interface AssignDto {
  userId: string;
  displayName?: string; // เผื่อสมาชิกบนบอร์ดที่ยังไม่มีใน users
}
