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
var PipelineProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let PipelineProcessor = PipelineProcessor_1 = class PipelineProcessor extends bullmq_1.WorkerHost {
    constructor(config) {
        super();
        this.config = config;
        this.logger = new common_1.Logger(PipelineProcessor_1.name);
    }
    async process(job) {
        const { job_id } = job.data;
        const pythonUrl = this.config.get('PYTHON_SERVICE_URL', 'http://localhost:8000');
        this.logger.log(`Triggering pipeline for job ${job_id}`);
        await axios_1.default.post(`${pythonUrl}/pipeline/run`, { job_id });
    }
};
exports.PipelineProcessor = PipelineProcessor;
exports.PipelineProcessor = PipelineProcessor = PipelineProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('pipeline'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PipelineProcessor);
//# sourceMappingURL=pipeline.processor.js.map