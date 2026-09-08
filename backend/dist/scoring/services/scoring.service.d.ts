import { ScoreBreakdown } from '../interfaces/rule-result.interface';
import { ExtractionResult } from '../../file-ingest/interfaces/extraction-result.interface';
import { ResumeParserService } from './resume-parser.service';
import { StepStartEvent, StepCompleteEvent } from '../../file-ingest/interfaces/check-event.interface';
export type RuleProgressCallback = (event: StepStartEvent | StepCompleteEvent) => void;
export declare class ScoringService {
    private readonly resumeParser;
    constructor(resumeParser: ResumeParserService);
    score(extractionResult: ExtractionResult, resumeTypeHint?: string, experienceLevel?: 'fresher' | 'experienced'): ScoreBreakdown;
    scoreWithProgress(extractionResult: ExtractionResult, resumeTypeHint: string | undefined, onProgress: RuleProgressCallback, experienceLevel?: 'fresher' | 'experienced'): ScoreBreakdown;
    private groupByCategory;
    private buildImageOnlyResult;
}
