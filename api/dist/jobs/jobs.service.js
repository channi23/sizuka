"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
let JobsService = class JobsService {
    constructor(prisma, pipelineQueue) {
        this.prisma = prisma;
        this.pipelineQueue = pipelineQueue;
    }
    async create(dto) {
        const job = await this.prisma.job.create({
            data: { companyName: dto.company_name, jdRaw: dto.jd_raw },
        });
        await this.pipelineQueue.add('run', { job_id: job.id }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        return job;
    }
    async findAll() {
        const jobs = await this.prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
        const enriched = await Promise.all(jobs.map(async (job) => {
            const agg = await this.prisma.candidate.aggregate({
                where: { jobId: job.id },
                _avg: { matchScore: true },
                _count: { id: true },
            });
            const emailsSent = await this.prisma.candidate.count({
                where: { jobId: job.id, emailStatus: { in: ['sent', 'opened', 'replied', 'failed'] } },
            });
            const replies = await this.prisma.candidate.count({
                where: { jobId: job.id, emailStatus: 'replied' },
            });
            return {
                ...job,
                candidateCount: agg._count.id,
                matchAvg: Math.round((agg._avg.matchScore ?? 0) * 100),
                emailsSent,
                replies,
            };
        }));
        return enriched;
    }
    async findOne(id) {
        const job = await this.prisma.job.findUniqueOrThrow({ where: { id } });
        const agg = await this.prisma.candidate.aggregate({
            where: { jobId: id },
            _avg: { matchScore: true },
            _count: { id: true },
        });
        const emailsSent = await this.prisma.candidate.count({
            where: { jobId: id, emailStatus: { in: ['sent', 'opened', 'replied', 'failed'] } },
        });
        const replies = await this.prisma.candidate.count({
            where: { jobId: id, emailStatus: 'replied' },
        });
        return {
            ...job,
            candidateCount: agg._count.id,
            matchAvg: Math.round((agg._avg.matchScore ?? 0) * 100),
            emailsSent,
            replies,
        };
    }
    async getShortlist(id, matchWeight = 0.6, interestWeight = 0.4) {
        const candidates = await this.prisma.candidate.findMany({
            where: { jobId: id },
            orderBy: { finalScore: 'desc' },
        });
        return candidates.map((c) => ({
            ...c,
            computedScore: matchWeight * (c.matchScore ?? 0) + interestWeight * (c.interestScore ?? 0),
        }));
    }
    async getEvents(id) {
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
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('pipeline')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], JobsService);
//# sourceMappingURL=jobs.service.js.map