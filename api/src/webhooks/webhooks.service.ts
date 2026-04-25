import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Handle an inbound email reply routed by Resend (production path). */
  async handleInboundReply(fromEmail: string, subject: string, body: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { email: fromEmail },
      orderBy: { createdAt: 'desc' },
    });
    if (!candidate) {
      this.logger.warn(`Inbound reply from unknown email: ${fromEmail}`);
      return { ok: true };
    }
    await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: { replyText: body, emailStatus: 'replied' },
    });
    await this._triggerAgent(candidate.id, body, subject);
    return { ok: true };
  }

  /**
   * Handle a reply captured by the Gmail IMAP listener (demo path).
   * Used because Resend free tier cannot receive inbound email without a custom domain.
   */
  async handleDemoReply(candidateId: string, replyText: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      this.logger.warn(`Demo reply: candidate ${candidateId} not found`);
      return { ok: false, error: 'Candidate not found' };
    }
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { replyText, emailStatus: 'replied' },
    });
    await this._triggerAgent(candidateId, replyText, 'Re: outreach');
    return { ok: true, candidate_id: candidateId };
  }

  /** POST to the Python agent's conversation endpoint to generate a reply. */
  private async _triggerAgent(candidateId: string, replyText: string, subject: string) {
    const agentUrl = this.config.get<string>('PYTHON_SERVICE_URL', 'http://localhost:8000');
    try {
      await axios.post(`${agentUrl}/conversation/respond`, {
        candidate_id: candidateId,
        reply_text: replyText,
        reply_subject: subject,
      });
      this.logger.log(`Triggered conversation for candidate ${candidateId}`);
    } catch (err) {
      this.logger.error(`Failed to trigger agent conversation: ${err.message}`);
    }
  }
}
