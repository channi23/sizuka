import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    create(dto: CreateJobDto): Promise<{
        id: string;
        companyName: string;
        jdRaw: string;
        jdParsed: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        candidateCount: number;
        matchAvg: number;
        emailsSent: number;
        replies: number;
        id: string;
        companyName: string;
        jdRaw: string;
        jdParsed: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getOutreachCandidates(): Promise<({
        job: {
            id: string;
            companyName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        jobId: string;
        matchScore: number | null;
        email: string | null;
        source: string | null;
        profileUrl: string | null;
        bio: string | null;
        skillsRaw: import("@prisma/client/runtime/library").JsonValue | null;
        interestScore: number | null;
        finalScore: number | null;
        matchExplanation: string | null;
        interestExplanation: string | null;
        skillsMatched: import("@prisma/client/runtime/library").JsonValue | null;
        skillsMissing: import("@prisma/client/runtime/library").JsonValue | null;
        emailStatus: string | null;
        resendEmailId: string | null;
        outreachSubject: string | null;
        outreachBody: string | null;
        replyText: string | null;
        conversationHistory: import("@prisma/client/runtime/library").JsonValue | null;
        conversationTurns: number;
    })[]>;
    findOne(id: string): Promise<{
        candidateCount: number;
        matchAvg: number;
        emailsSent: number;
        replies: number;
        id: string;
        companyName: string;
        jdRaw: string;
        jdParsed: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getShortlist(id: string, matchWeight?: string, interestWeight?: string): Promise<{
        computedScore: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        jobId: string;
        matchScore: number | null;
        email: string | null;
        source: string | null;
        profileUrl: string | null;
        bio: string | null;
        skillsRaw: import("@prisma/client/runtime/library").JsonValue | null;
        interestScore: number | null;
        finalScore: number | null;
        matchExplanation: string | null;
        interestExplanation: string | null;
        skillsMatched: import("@prisma/client/runtime/library").JsonValue | null;
        skillsMissing: import("@prisma/client/runtime/library").JsonValue | null;
        emailStatus: string | null;
        resendEmailId: string | null;
        outreachSubject: string | null;
        outreachBody: string | null;
        replyText: string | null;
        conversationHistory: import("@prisma/client/runtime/library").JsonValue | null;
        conversationTurns: number;
    }[]>;
    getEvents(id: string): Promise<{
        id: number;
        createdAt: Date;
        jobId: string;
        stage: string | null;
        message: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
