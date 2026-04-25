import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import axios from 'axios';

@Processor('pipeline')
export class PipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(PipelineProcessor.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async process(job: Job<{ job_id: string }>) {
    const { job_id } = job.data;
    const pythonUrl = this.config.get<string>('PYTHON_SERVICE_URL', 'http://localhost:8000');
    this.logger.log(`Triggering pipeline for job ${job_id}`);
    await axios.post(`${pythonUrl}/pipeline/run`, { job_id });
  }
}
