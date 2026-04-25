import { WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
export declare class PipelineProcessor extends WorkerHost {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    process(job: Job<{
        job_id: string;
    }>): Promise<void>;
}
