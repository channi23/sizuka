import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    handleInboundReply(fromEmail: string, subject: string, body: string): Promise<{
        ok: boolean;
    }>;
    handleDemoReply(candidateId: string, replyText: string): Promise<{
        ok: boolean;
        error: string;
        candidate_id?: undefined;
    } | {
        ok: boolean;
        candidate_id: string;
        error?: undefined;
    }>;
}
