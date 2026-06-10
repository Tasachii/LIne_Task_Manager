import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AssignDto, MoveDto, UpdateStatusDto } from './dto/task.types';
import { BoardKeyGuard } from '../auth/board-key.guard';

@Controller('tasks')
@UseGuards(BoardKeyGuard) // ทุก endpoint ของบอร์ดต้องมี x-board-key (ถ้าตั้ง BOARD_PASSWORD)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return this.tasks.findAll();
  }

  // เปลี่ยนสถานะอย่างเดียว (ต่อท้ายคอลัมน์ใหม่)
  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.tasks.changeStatus(id, dto.status);
  }

  // ใช้ตอนลากการ์ด: ระบุทั้งคอลัมน์และตำแหน่งในคอลัมน์
  @Patch(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveDto) {
    return this.tasks.move(id, dto.status, dto.index);
  }

  // กดรับงาน
  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignDto) {
    return this.tasks.assign(id, dto.userId, dto.displayName);
  }
}
