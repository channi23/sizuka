import { ConfigService } from '@nestjs/config';
import { InternalService, PipelineEventDto } from './internal.service';
export declare class InternalController {
    private readonly internalService;
    private readonly config;
    constructor(internalService: InternalService, config: ConfigService);
    handleEvent(secret: string, dto: PipelineEventDto): Promise<{
        ok: boolean;
    }>;
}
