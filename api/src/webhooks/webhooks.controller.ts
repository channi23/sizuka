import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

interface ResendTrackingPayload {
  type: string;
  data: { email_id?: string };
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

@Controller('webhook')
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post('email-events')
  async handleEmailEvent(@Body() payload: ResendTrackingPayload) {
    const emailId = payload.data?.email_id;
    if (!emailId) return { ok: true };

    const statusMap: Record<string, string> = {
      'email.opened': 'opened',
      'email.delivered': 'sent',
      'email.bounced': 'failed',
    };
    const status = statusMap[payload.type];
    if (status) {
      await this.prisma.candidate.updateMany({
        where: { resendEmailId: emailId },
        data: { emailStatus: status },
      });
    }
    return { ok: true };
  }

  @Post('email-reply')
  async handleInboundReply(@Body() payload: ResendInboundPayload) {
    const from = payload.from?.match(/<(.+)>/)?.[1] ?? payload.from;
    const body = payload.text || payload.html?.replace(/<[^>]+>/g, '') || '';
    return this.webhooksService.handleInboundReply(from, payload.subject ?? '', body);
  }

  // Demo: trigger conversational agent for a specific candidate by ID
  @Post('demo-reply')
  async handleDemoReply(@Body() payload: DemoReplyPayload) {
    return this.webhooksService.handleDemoReply(payload.candidate_id, payload.reply_text);
  }
}
