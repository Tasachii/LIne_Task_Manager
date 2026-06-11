import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AssignDto, MoveDto, UpdateStatusDto } from './dto/task.types';
import { BoardKeyGuard } from '../auth/board-key.guard';

@Controller('tasks')
@UseGuards(BoardKeyGuard) // all board endpoints require x-board-key when BOARD_PASSWORD is set
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return this.tasks.findAll();
  }

  // Change status only (appends to the end of the new column).
  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.tasks.changeStatus(id, dto.status);
  }

  // Used when dragging a card: specify both the target column and position within it.
  @Patch(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveDto) {
    return this.tasks.move(id, dto.status, dto.index);
  }

  // Assign a task to a user.
  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignDto) {
    return this.tasks.assign(id, dto.userId, dto.displayName);
  }
}
