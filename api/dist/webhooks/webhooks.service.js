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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async handleInboundReply(fromEmail, subject, body) {
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
        const agentUrl = this.config.get('PYTHON_SERVICE_URL', 'http://localhost:8000');
        try {
            await axios_1.default.post(`${agentUrl}/conversation/respond`, {
                candidate_id: candidate.id,
                reply_text: body,
                reply_subject: subject,
            });
        }
        catch (err) {
            this.logger.error(`Failed to trigger agent conversation: ${err.message}`);
        }
        return { ok: true };
    }
    async handleDemoReply(candidateId, replyText) {
        const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
        if (!candidate) {
            this.logger.warn(`Demo reply: candidate ${candidateId} not found`);
            return { ok: false, error: 'Candidate not found' };
        }
        await this.prisma.candidate.update({
            where: { id: candidateId },
            data: { replyText, emailStatus: 'replied' },
        });
        const agentUrl = this.config.get('PYTHON_SERVICE_URL', 'http://localhost:8000');
        try {
            await axios_1.default.post(`${agentUrl}/conversation/respond`, {
                candidate_id: candidateId,
                reply_text: replyText,
                reply_subject: 'Re: outreach',
            });
        }
        catch (err) {
            this.logger.error(`Failed to trigger agent conversation: ${err.message}`);
        }
        return { ok: true, candidate_id: candidateId };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map