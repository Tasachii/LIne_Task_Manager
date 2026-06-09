import { Module } from '@nestjs/common';
import { LineClientService } from './line-client.service';

@Module({
  providers: [LineClientService],
  exports: [LineClientService],
})
export class LineModule {}
