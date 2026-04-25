import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

const QUEUE_ATTEMPTS = 3;
const QUEUE_BACKOFF_MS = 5000;
const SENT_STATUSES = ['sent', 'opened', 'replied', 'failed'] as const;

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('pipeline') private readonly pipelineQueue: Queue,
  ) {}

  async create(dto: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: { companyName: dto.company_name, jdRaw: dto.jd_raw },
    });
    await this.pipelineQueue.add(
      'run',
      { job_id: job.id },
      { attempts: QUEUE_ATTEMPTS, backoff: { type: 'exponential', delay: QUEUE_BACKOFF_MS } },
    );
    return job;
  }

  async findAll() {
    const jobs = await this.prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
    return Promise.all(jobs.map((job) => this._enrichJob(job)));
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUniqueOrThrow({ where: { id } });
    return this._enrichJob(job);
  }

  async getShortlist(id: string, matchWeight = 0.6, interestWeight = 0.4) {
    const candidates = await this.prisma.candidate.findMany({
      where: { jobId: id },
      orderBy: { finalScore: 'desc' },
    });
    return candidates.map((c) => ({
      ...c,
      computedScore: matchWeight * (c.matchScore ?? 0) + interestWeight * (c.interestScore ?? 0),
    }));
  }

  async getEvents(id: string) {
    return this.prisma.pipelineEvent.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getOutreachCandidates() {
    return this.prisma.candidate.findMany({
      where: { matchScore: { not: null } },
      orderBy: { finalScore: 'desc' },
      include: { job: { select: { id: true, companyName: true } } },
    });
  }

  /** Attach candidate aggregate stats to a job row. */
  private async _enrichJob(job: Awaited<ReturnType<typeof this.prisma.job.findUniqueOrThrow>>) {
    const [agg, emailsSent, replies] = await Promise.all([
      this.prisma.candidate.aggregate({
        where: { jobId: job.id },
        _avg: { matchScore: true },
        _count: { id: true },
      }),
      this.prisma.candidate.count({
        where: { jobId: job.id, emailStatus: { in: [...SENT_STATUSES] } },
      }),
      this.prisma.candidate.count({
        where: { jobId: job.id, emailStatus: 'replied' },
      }),
    ]);
    return {
      ...job,
      candidateCount: agg._count.id,
      matchAvg: Math.round((agg._avg.matchScore ?? 0) * 100),
      emailsSent,
      replies,
    };
  }
}
