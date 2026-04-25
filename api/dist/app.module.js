"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_1 = require("@bull-board/nestjs");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
const express_1 = require("@bull-board/express");
const prisma_module_1 = require("./prisma/prisma.module");
const jobs_module_1 = require("./jobs/jobs.module");
const workers_module_1 = require("./workers/workers.module");
const events_module_1 = require("./events/events.module");
const internal_module_1 = require("./internal/internal.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: { url: config.get('REDIS_URL', 'redis://localhost:6379') },
                }),
            }),
            nestjs_1.BullBoardModule.forRoot({ route: '/admin/queues', adapter: express_1.ExpressAdapter }),
            nestjs_1.BullBoardModule.forFeature({ name: 'pipeline', adapter: bullMQAdapter_1.BullMQAdapter }),
            prisma_module_1.PrismaModule,
            jobs_module_1.JobsModule,
            workers_module_1.WorkersModule,
            events_module_1.EventsModule,
            internal_module_1.InternalModule,
            webhooks_module_1.WebhooksModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map