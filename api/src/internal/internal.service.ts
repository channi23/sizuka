import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService, PipelineEventPayload } from '../events/events.service';

export interface PipelineEventDto {
  job_id: string;
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class InternalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async handlePipelineEvent(dto: PipelineEventDto) {
    await this.prisma.pipelineEvent.create({
      data: {
        jobId: dto.job_id,
        stage: dto.stage,
        message: dto.message,
        metadata: (dto.metadata ?? {}) as any,
      },
    });

    if (dto.stage === 'complete' || dto.stage === 'failed') {
      await this.prisma.job.update({
        where: { id: dto.job_id },
        data: { status: dto.stage },
      });
    } else {
      await this.prisma.job.update({
        where: { id: dto.job_id },
        data: { status: dto.stage },
      });
    }

    const payload: PipelineEventPayload = {
      stage: dto.stage,
      message: dto.message,
      metadata: dto.metadata,
    };
    this.eventsService.emit(dto.job_id, payload);

    return { ok: true };
  }
}
