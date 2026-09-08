import { MessageEvent, OnModuleDestroy } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';
import { FileValidatorService } from './services/file-validator.service';
import { TextExtractorService } from './services/text-extractor.service';
import { ScoringService } from '../scoring/services/scoring.service';
import { ResumeParserService } from '../scoring/services/resume-parser.service';
import { AiInsightService } from '../ai-insight/services/ai-insight.service';
import { UsageService } from '../usage/services/usage.service';
import { DeviceIdentityService } from '../usage/services/device-identity.service';
import { AuthService } from '../auth/services/auth.service';
import { ScoreBreakdown } from '../scoring/interfaces/rule-result.interface';
import type { AuthPayload } from '../auth/interfaces/auth.interface';
import type { UsageStatus } from '../usage/interfaces/usage.interface';
export declare class FileIngestController implements OnModuleDestroy {
    private readonly fileValidator;
    private readonly textExtractor;
    private readonly scoringService;
    private readonly resumeParser;
    private readonly aiInsightService;
    private readonly usageService;
    private readonly deviceIdentityService;
    private readonly authService;
    private readonly logger;
    private readonly pendingChecks;
    private readonly cleanupTimer;
    constructor(fileValidator: FileValidatorService, textExtractor: TextExtractorService, scoringService: ScoringService, resumeParser: ResumeParserService, aiInsightService: AiInsightService, usageService: UsageService, deviceIdentityService: DeviceIdentityService, authService: AuthService);
    onModuleDestroy(): void;
    getUsage(req: Request & {
        user?: AuthPayload;
    }, res: Response): UsageStatus;
    upload(file: Express.Multer.File, resumeType: string | undefined, experienceLevel: 'fresher' | 'experienced' | undefined, req: Request & {
        user?: AuthPayload;
    }, res: Response): Promise<ScoreBreakdown>;
    initiateCheck(file: Express.Multer.File, resumeType: string | undefined, experienceLevel: 'fresher' | 'experienced' | undefined, req: Request & {
        user?: AuthPayload;
    }, res: Response): Promise<{
        checkId: string;
    }>;
    streamCheckProgress(checkId: string): Observable<MessageEvent>;
    private enforceUsageLimit;
    private runScoringWithInsights;
    private extractText;
    private validateResumeType;
    private checkScannedPdf;
    private evictStalePendingChecks;
}
