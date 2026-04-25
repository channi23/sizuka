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
exports.InternalController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const internal_service_1 = require("./internal.service");
let InternalController = class InternalController {
    constructor(internalService, config) {
        this.internalService = internalService;
        this.config = config;
    }
    handleEvent(secret, dto) {
        const expected = this.config.get('INTERNAL_API_SECRET');
        if (expected && secret !== expected)
            throw new common_1.UnauthorizedException();
        return this.internalService.handlePipelineEvent(dto);
    }
};
exports.InternalController = InternalController;
__decorate([
    (0, common_1.Post)('pipeline-event'),
    __param(0, (0, common_1.Headers)('x-internal-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InternalController.prototype, "handleEvent", null);
exports.InternalController = InternalController = __decorate([
    (0, common_1.Controller)('internal'),
    __metadata("design:paramtypes", [internal_service_1.InternalService,
        config_1.ConfigService])
], InternalController);
//# sourceMappingURL=internal.controller.js.map