import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PipelineProcessor } from './pipeline.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'pipeline' })],
  providers: [PipelineProcessor],
})
export class WorkersModule {}
