import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { LineModule } from '../line/line.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [LineModule, TasksModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
