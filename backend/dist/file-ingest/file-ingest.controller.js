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
var FileIngestController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileIngestController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const rxjs_1 = require("rxjs");
const file_validator_service_1 = require("./services/file-validator.service");
const text_extractor_service_1 = require("./services/text-extractor.service");
const scoring_service_1 = require("../scoring/services/scoring.service");
const MULTER_OPTIONS = {
    limits: { fileSize: 5 * 1024 * 1024 },
    storage: undefined,
};
const PENDING_CHECK_TTL_MS = 30_000;
let FileIngestController = FileIngestController_1 = class FileIngestController {
    fileValidator;
    textExtractor;
    scoringService;
    logger = new common_1.Logger(FileIngestController_1.name);
    pendingChecks = new Map();
    cleanupTimer;
    constructor(fileValidator, textExtractor, scoringService) {
        this.fileValidator = fileValidator;
        this.textExtractor = textExtractor;
        this.scoringService = scoringService;
        this.cleanupTimer = setInterval(() => this.evictStalePendingChecks(), 60_000);
        this.cleanupTimer.unref();
    }
    onModuleDestroy() {
        clearInterval(this.cleanupTimer);
    }
    async upload(file, resumeType) {
        const { type } = this.fileValidator.validate(file);
        this.logger.log(`Processing ${type.toUpperCase()} upload: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`);
        const extractionResult = await this.extractText(file, type);
        this.validateResumeType(resumeType);
        const scoreBreakdown = this.scoringService.score(extractionResult, resumeType);
        this.logger.log(`Scored ${file.originalname}: ${scoreBreakdown.overallScore}/100 (${scoreBreakdown.band}) in ${scoreBreakdown.meta.processingTimeMs}ms`);
        return scoreBreakdown;
    }
    async initiateCheck(file, resumeType) {
        const { type } = this.fileValidator.validate(file);
        this.logger.log(`Initiating check for ${type.toUpperCase()}: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`);
        const extractionResult = await this.extractText(file, type);
        this.validateResumeType(resumeType);
        const checkId = crypto.randomUUID();
        this.pendingChecks.set(checkId, {
            file,
            resumeType,
            extractionResult,
            createdAt: Date.now(),
        });
        this.logger.log(`Check ${checkId.slice(0, 8)} initiated for ${file.originalname}`);
        return { checkId };
    }
    streamCheckProgress(checkId) {
        const pending = this.pendingChecks.get(checkId);
        if (!pending) {
            throw new common_1.NotFoundException(`Check "${checkId}" not found. It may have expired or already been consumed.`);
        }
        this.pendingChecks.delete(checkId);
        const subject = new rxjs_1.Subject();
        setImmediate(() => {
            try {
                const result = this.scoringService.scoreWithProgress(pending.extractionResult, pending.resumeType, (event) => {
                    subject.next({
                        data: event,
                        type: event.type,
                    });
                });
                const completeEvent = {
                    type: 'complete',
                    result,
                };
                subject.next({
                    data: completeEvent,
                    type: 'complete',
                });
                this.logger.log(`Check ${checkId.slice(0, 8)} complete: ${result.overallScore}/100 (${result.band})`);
                subject.complete();
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Scoring failed unexpectedly';
                this.logger.error(`Check ${checkId.slice(0, 8)} failed: ${message}`);
                const errorEvent = {
                    type: 'error',
                    message,
                };
                subject.next({
                    data: errorEvent,
                    type: 'error',
                });
                subject.complete();
            }
        });
        return subject.asObservable();
    }
    async extractText(file, type) {
        try {
            if (type === 'pdf') {
                return await this.textExtractor.extractFromPdf(file.buffer);
            }
            return await this.textExtractor.extractFromDocx(file.buffer);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('password') ||
                errorMessage.includes('encrypted') ||
                errorMessage.includes('Password')) {
                throw new common_1.BadRequestException('This file appears to be password-protected. Please remove the password protection and re-upload.');
            }
            this.logger.error(`Text extraction failed: ${errorMessage}`);
            throw new common_1.BadRequestException('Failed to extract text from the uploaded file. The file may be corrupted — try re-exporting it from the original source.');
        }
    }
    validateResumeType(resumeType) {
        const validTypes = ['tech', 'finance', 'support', 'general'];
        if (resumeType && !validTypes.includes(resumeType)) {
            throw new common_1.BadRequestException(`Invalid resume type "${resumeType}". Valid types: ${validTypes.join(', ')}.`);
        }
    }
    evictStalePendingChecks() {
        const now = Date.now();
        for (const [id, check] of this.pendingChecks) {
            if (now - check.createdAt > PENDING_CHECK_TTL_MS) {
                this.pendingChecks.delete(id);
                this.logger.warn(`Evicted stale pending check: ${id.slice(0, 8)}`);
            }
        }
    }
};
exports.FileIngestController = FileIngestController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', MULTER_OPTIONS)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('resumeType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FileIngestController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('check'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', MULTER_OPTIONS)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('resumeType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FileIngestController.prototype, "initiateCheck", null);
__decorate([
    (0, common_1.Sse)('check/:checkId/stream'),
    __param(0, (0, common_1.Param)('checkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", rxjs_1.Observable)
], FileIngestController.prototype, "streamCheckProgress", null);
exports.FileIngestController = FileIngestController = FileIngestController_1 = __decorate([
    (0, common_1.Controller)('resume'),
    __metadata("design:paramtypes", [file_validator_service_1.FileValidatorService,
        text_extractor_service_1.TextExtractorService,
        scoring_service_1.ScoringService])
], FileIngestController);
//# sourceMappingURL=file-ingest.controller.js.map