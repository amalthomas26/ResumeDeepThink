"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileIngestModule = void 0;
const common_1 = require("@nestjs/common");
const file_ingest_controller_1 = require("./file-ingest.controller");
const file_validator_service_1 = require("./services/file-validator.service");
const text_extractor_service_1 = require("./services/text-extractor.service");
const scoring_module_1 = require("../scoring/scoring.module");
const ai_insight_module_1 = require("../ai-insight/ai-insight.module");
const usage_module_1 = require("../usage/usage.module");
const auth_module_1 = require("../auth/auth.module");
let FileIngestModule = class FileIngestModule {
};
exports.FileIngestModule = FileIngestModule;
exports.FileIngestModule = FileIngestModule = __decorate([
    (0, common_1.Module)({
        imports: [scoring_module_1.ScoringModule, ai_insight_module_1.AiInsightModule, usage_module_1.UsageModule, auth_module_1.AuthModule],
        controllers: [file_ingest_controller_1.FileIngestController],
        providers: [file_validator_service_1.FileValidatorService, text_extractor_service_1.TextExtractorService],
    })
], FileIngestModule);
//# sourceMappingURL=file-ingest.module.js.map