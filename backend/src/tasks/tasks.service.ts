import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { EventsGateway } from '../realtime/events.gateway';
import { NewTaskInput, Task, TaskStatus, TASK_STATUSES } from './dto/task.types';

@Injectable()
export class TasksService {
  constructor(
    private readonly repo: TasksRepository,
    private readonly events: EventsGateway,
  ) {}

  async createMany(inputs: NewTaskInput[]): Promise<Task[]> {
    const created: Task[] = [];
    for (const input of inputs) {
      const task = await this.repo.createTask(input);
      this.events.taskCreated(task); // realtime broadcast
      created.push(task);
    }
    return created;
  }

  findAll(): Promise<Task[]> {
    return this.repo.findAll();
  }

  async changeStatus(id: string, status: TaskStatus): Promise<Task> {
    if (!TASK_STATUSES.includes(status)) {
      throw new NotFoundException(`unknown status: ${status}`);
    }
    const task = await this.repo.updateStatus(id, status);
    if (!task) throw new NotFoundException('task not found');
    this.events.taskUpdated(task);
    return task;
  }

  async assign(id: string, userId: string, displayName?: string): Promise<Task> {
    if (displayName) {
      await this.repo.upsertUser(userId, displayName); // กัน FK พังถ้ายังไม่มี user นี้
    }
    const task = await this.repo.assign(id, userId);
    if (!task) throw new NotFoundException('task not found');
    this.events.taskUpdated(task);
    return task;
  }
}
