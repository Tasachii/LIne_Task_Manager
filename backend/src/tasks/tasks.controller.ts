import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AssignDto, UpdateStatusDto } from './dto/task.types';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return this.tasks.findAll();
  }

  // ใช้ตอนลากการ์ดข้ามคอลัมน์
  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.tasks.changeStatus(id, dto.status);
  }

  // กดรับงาน
  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignDto) {
    return this.tasks.assign(id, dto.userId, dto.displayName);
  }
}
