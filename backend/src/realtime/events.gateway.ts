import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Task } from '../tasks/dto/task.types';

// Broadcasts events to all connected board clients so they see updates in real time.
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? '*' } })
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  // If BOARD_PASSWORD is set, the client must supply auth.key on connect.
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

  // Multiple card positions changed simultaneously (drag reorder) — clients should refetch the full board.
  tasksReordered() {
    this.server.emit('tasks:refresh');
  }
}
