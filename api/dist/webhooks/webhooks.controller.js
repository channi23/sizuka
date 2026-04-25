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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const webhooks_service_1 = require("./webhooks.service");
let WebhooksController = class WebhooksController {
    constructor(prisma, webhooksService) {
        this.prisma = prisma;
        this.webhooksService = webhooksService;
    }
    async handleEmailEvent(payload) {
        const emailId = payload.data?.email_id;
        if (!emailId)
            return { ok: true };
        const statusMap = {
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
    async handleInboundReply(payload) {
        const from = payload.from?.match(/<(.+)>/)?.[1] ?? payload.from;
        const body = payload.text || payload.html?.replace(/<[^>]+>/g, '') || '';
        return this.webhooksService.handleInboundReply(from, payload.subject ?? '', body);
    }
    async handleDemoReply(payload) {
        return this.webhooksService.handleDemoReply(payload.candidate_id, payload.reply_text);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('email-events'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleEmailEvent", null);
__decorate([
    (0, common_1.Post)('email-reply'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleInboundReply", null);
__decorate([
    (0, common_1.Post)('demo-reply'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleDemoReply", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhook'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map