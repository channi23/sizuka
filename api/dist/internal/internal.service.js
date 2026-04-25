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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_service_1 = require("../events/events.service");
let InternalService = class InternalService {
    constructor(prisma, eventsService) {
        this.prisma = prisma;
        this.eventsService = eventsService;
    }
    async handlePipelineEvent(dto) {
        await this.prisma.pipelineEvent.create({
            data: {
                jobId: dto.job_id,
                stage: dto.stage,
                message: dto.message,
                metadata: (dto.metadata ?? {}),
            },
        });
        if (dto.stage === 'complete' || dto.stage === 'failed') {
            await this.prisma.job.update({
                where: { id: dto.job_id },
                data: { status: dto.stage },
            });
        }
        else {
            await this.prisma.job.update({
                where: { id: dto.job_id },
                data: { status: dto.stage },
            });
        }
        const payload = {
            stage: dto.stage,
            message: dto.message,
            metadata: dto.metadata,
        };
        this.eventsService.emit(dto.job_id, payload);
        return { ok: true };
    }
};
exports.InternalService = InternalService;
exports.InternalService = InternalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_service_1.EventsService])
], InternalService);
//# sourceMappingURL=internal.service.js.map