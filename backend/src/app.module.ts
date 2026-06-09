import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { LineModule } from './line/line.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TasksModule } from './tasks/tasks.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [DatabaseModule, LineModule, RealtimeModule, TasksModule, WebhookModule],
})
export class AppModule {}
