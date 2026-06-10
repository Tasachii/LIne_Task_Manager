import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Task } from '../tasks/dto/task.types';

// ปล่อย event ให้ทุก client ที่เปิดบอร์ดอยู่ เห็น update พร้อมกัน
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? '*' } })
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  // ถ้าตั้ง BOARD_PASSWORD ไว้ client ต้องส่ง auth.key มาตอน connect
  handleConnection(client: Socket) {
    const password = process.env.BOARD_PASSWORD;
    if (password && client.handshake.auth?.key !== password) {
      client.disconnect(true);
    }
  }

  taskCreated(task: Task) {
    this.server.emit('task:created', task);
  }

  taskUpdated(task: Task) {
    this.server.emit('task:updated', task);
  }

  // ลำดับการ์ดหลายใบเปลี่ยนพร้อมกัน (ลากจัดตำแหน่ง) → ให้ client ดึงบอร์ดใหม่ทั้งชุด
  tasksReordered() {
    this.server.emit('tasks:refresh');
  }
}
