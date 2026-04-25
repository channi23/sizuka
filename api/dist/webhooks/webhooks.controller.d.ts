import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';
interface ResendTrackingPayload {
    type: string;
    data: {
        email_id?: string;
    };
}
interface ResendInboundPayload {
    from: string;
    subject?: string;
    text?: string;
    html?: string;
}
interface DemoReplyPayload {
    candidate_id: string;
    reply_text: string;
}
export declare class WebhooksController {
    private readonly prisma;
    private readonly webhooksService;
    constructor(prisma: PrismaService, webhooksService: WebhooksService);
    handleEmailEvent(payload: ResendTrackingPayload): Promise<{
        ok: boolean;
    }>;
    handleInboundReply(payload: ResendInboundPayload): Promise<{
        ok: boolean;
    }>;
    handleDemoReply(payload: DemoReplyPayload): Promise<{
        ok: boolean;
        error: string;
        candidate_id?: undefined;
    } | {
        ok: boolean;
        candidate_id: string;
        error?: undefined;
    }>;
}
export {};
