import { MessageEvent, OnModuleDestroy } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileValidatorService } from './services/file-validator.service';
import { TextExtractorService } from './services/text-extractor.service';
import { ScoringService } from '../scoring/services/scoring.service';
import { ScoreBreakdown } from '../scoring/interfaces/rule-result.interface';
export declare class FileIngestController implements OnModuleDestroy {
    private readonly fileValidator;
    private readonly textExtractor;
    private readonly scoringService;
    private readonly logger;
    private readonly pendingChecks;
    private readonly cleanupTimer;
    constructor(fileValidator: FileValidatorService, textExtractor: TextExtractorService, scoringService: ScoringService);
    onModuleDestroy(): void;
    upload(file: Express.Multer.File, resumeType?: string): Promise<ScoreBreakdown>;
    initiateCheck(file: Express.Multer.File, resumeType?: string): Promise<{
        checkId: string;
    }>;
    streamCheckProgress(checkId: string): Observable<MessageEvent>;
    private extractText;
    private validateResumeType;
    private evictStalePendingChecks;
}
