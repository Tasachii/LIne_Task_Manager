import { Task, TaskStatus } from './types';

// dev proxy ส่ง /tasks ไป backend ให้แล้ว
const BASE = '';

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE}/tasks`);
  if (!res.ok) throw new Error('โหลด tasks ไม่สำเร็จ');
  return res.json();
}

export async function updateStatus(id: string, status: TaskStatus): Promise<Task> {
  const res = await fetch(`${BASE}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('เปลี่ยนสถานะไม่สำเร็จ');
  return res.json();
}

export async function assignTask(id: string, userId: string, displayName: string): Promise<Task> {
  const res = await fetch(`${BASE}/tasks/${id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, displayName }),
  });
  if (!res.ok) throw new Error('รับงานไม่สำเร็จ');
  return res.json();
}
