import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Task } from '../tasks/dto/task.types';

// ปล่อย event ให้ทุก client ที่เปิดบอร์ดอยู่ เห็น update พร้อมกัน
@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  taskCreated(task: Task) {
    this.server.emit('task:created', task);
  }

  taskUpdated(task: Task) {
    this.server.emit('task:updated', task);
  }
}
