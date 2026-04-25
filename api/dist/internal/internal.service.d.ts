import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
export interface PipelineEventDto {
    job_id: string;
    stage: string;
    message: string;
    metadata?: Record<string, unknown>;
}
export declare class InternalService {
    private readonly prisma;
    private readonly eventsService;
    constructor(prisma: PrismaService, eventsService: EventsService);
    handlePipelineEvent(dto: PipelineEventDto): Promise<{
        ok: boolean;
    }>;
}
