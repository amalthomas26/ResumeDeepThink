import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  NotFoundException,
  HttpCode,
  Logger,
  Sse,
  MessageEvent,
  OnModuleDestroy,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable, Subject } from 'rxjs';
import { FileValidatorService } from './services/file-validator.service';
import { TextExtractorService } from './services/text-extractor.service';
import { ScoringService } from '../scoring/services/scoring.service';
import { ScoreBreakdown } from '../scoring/interfaces/rule-result.interface';
import { ExtractionResult } from './interfaces/extraction-result.interface';
import { CheckEvent } from './interfaces/check-event.interface';

/**
 * Multer configuration: 5MB limit, memory storage (buffer-based).
 */
const MULTER_OPTIONS = {
  limits: { fileSize: 5 * 1024 * 1024 },
  storage: undefined, // memory storage (default)
};

/**
 * Pending check stored in memory while waiting for SSE connection.
 * TTL-evicted to prevent memory leaks from abandoned checks.
 */
interface PendingCheck {
  readonly file: Express.Multer.File;
  readonly resumeType: string | undefined;
  readonly extractionResult: ExtractionResult;
  readonly createdAt: number;
}

/** Maximum age for a pending check before eviction (30 seconds). */
const PENDING_CHECK_TTL_MS = 30_000;

@Controller('resume')
export class FileIngestController implements OnModuleDestroy {
  private readonly logger = new Logger(FileIngestController.name);

  /**
   * In-memory store for pending checks awaiting SSE stream connection.
   * In production, this would use Redis; for Phase 2 (single-instance),
   * a Map with TTL eviction is sufficient.
   */
  private readonly pendingChecks = new Map<string, PendingCheck>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(
    private readonly fileValidator: FileValidatorService,
    private readonly textExtractor: TextExtractorService,
    private readonly scoringService: ScoringService,
  ) {
    // Periodic cleanup of stale pending checks (every 60s)
    // .unref() ensures this timer does not keep Node.js event loop alive in tests
    this.cleanupTimer = setInterval(() => this.evictStalePendingChecks(), 60_000);
    this.cleanupTimer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
  }

  /**
   * POST /resume/upload
   *
   * Per roadmap Phase 1: "single endpoint — upload → parse → run all
   * deterministic rules → return JSON score breakdown."
   *
   * Accepts multipart: resume file + optional resumeType hint.
   * Returns the complete ScoreBreakdown synchronously.
   */
  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('resumeType') resumeType?: string,
  ): Promise<ScoreBreakdown> {
    // 1. Validate the file (magic bytes, size, extension)
    const { type } = this.fileValidator.validate(file);

    this.logger.log(
      `Processing ${type.toUpperCase()} upload: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`,
    );

    // 2. Extract text
    const extractionResult = await this.extractText(file, type);

    // 3. Validate resume type hint if provided
    this.validateResumeType(resumeType);

    // 4. Score the resume
    const scoreBreakdown = this.scoringService.score(
      extractionResult,
      resumeType,
    );

    this.logger.log(
      `Scored ${file.originalname}: ${scoreBreakdown.overallScore}/100 (${scoreBreakdown.band}) in ${scoreBreakdown.meta.processingTimeMs}ms`,
    );

    return scoreBreakdown;
  }

  /**
   * POST /resume/check
   *
   * Per architecture.md: "POST /resume/check kicks off processing and
   * immediately returns a checkId."
   *
   * Validates the file, extracts text, stores the pending check,
   * and returns { checkId } for the frontend to open an SSE stream.
   */
  @Post('check')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
  async initiateCheck(
    @UploadedFile() file: Express.Multer.File,
    @Body('resumeType') resumeType?: string,
  ): Promise<{ checkId: string }> {
    // 1. Validate the file
    const { type } = this.fileValidator.validate(file);

    this.logger.log(
      `Initiating check for ${type.toUpperCase()}: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`,
    );

    // 2. Extract text (done upfront so SSE stream can start scoring immediately)
    const extractionResult = await this.extractText(file, type);

    // 3. Validate resume type hint if provided
    this.validateResumeType(resumeType);

    // 4. Generate checkId and store
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

  /**
   * GET /resume/check/:checkId/stream
   *
   * Per architecture.md: "Frontend opens GET /resume/check/:checkId/stream (SSE).
   * Backend emits one event per rule as it completes, then a final complete event."
   */
  @Sse('check/:checkId/stream')
  streamCheckProgress(
    @Param('checkId') checkId: string,
  ): Observable<MessageEvent> {
    const pending = this.pendingChecks.get(checkId);
    if (!pending) {
      throw new NotFoundException(
        `Check "${checkId}" not found. It may have expired or already been consumed.`,
      );
    }

    // Remove from pending — each checkId is single-use
    this.pendingChecks.delete(checkId);

    const subject = new Subject<MessageEvent>();

    // Run scoring with progress emission asynchronously (next tick)
    // so the SSE connection is established before events start flowing.
    setImmediate(() => {
      try {
        const result = this.scoringService.scoreWithProgress(
          pending.extractionResult,
          pending.resumeType,
          (event) => {
            subject.next({
              data: event,
              type: event.type,
            });
          },
        );

        // Emit the final complete event with full result
        const completeEvent: CheckEvent = {
          type: 'complete',
          result,
        };
        subject.next({
          data: completeEvent,
          type: 'complete',
        });

        this.logger.log(
          `Check ${checkId.slice(0, 8)} complete: ${result.overallScore}/100 (${result.band})`,
        );

        // Close the stream
        subject.complete();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Scoring failed unexpectedly';
        this.logger.error(`Check ${checkId.slice(0, 8)} failed: ${message}`);

        const errorEvent: CheckEvent = {
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

  // ─── Private helpers ─────────────────────────────────────────

  /**
   * Extracts text from a file buffer, handling password-protected and
   * corrupted files with clear error messages.
   */
  private async extractText(
    file: Express.Multer.File,
    type: 'pdf' | 'docx',
  ): Promise<ExtractionResult> {
    try {
      if (type === 'pdf') {
        return await this.textExtractor.extractFromPdf(file.buffer);
      }
      return await this.textExtractor.extractFromDocx(file.buffer);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('password') ||
        errorMessage.includes('encrypted') ||
        errorMessage.includes('Password')
      ) {
        throw new BadRequestException(
          'This file appears to be password-protected. Please remove the password protection and re-upload.',
        );
      }

      this.logger.error(`Text extraction failed: ${errorMessage}`);
      throw new BadRequestException(
        'Failed to extract text from the uploaded file. The file may be corrupted — try re-exporting it from the original source.',
      );
    }
  }

  /**
   * Validates the optional resumeType hint against the known set of types.
   */
  private validateResumeType(resumeType?: string): void {
    const validTypes = ['tech', 'finance', 'support', 'general'];
    if (resumeType && !validTypes.includes(resumeType)) {
      throw new BadRequestException(
        `Invalid resume type "${resumeType}". Valid types: ${validTypes.join(', ')}.`,
      );
    }
  }

  /**
   * Evicts pending checks older than PENDING_CHECK_TTL_MS to prevent memory leaks.
   */
  private evictStalePendingChecks(): void {
    const now = Date.now();
    for (const [id, check] of this.pendingChecks) {
      if (now - check.createdAt > PENDING_CHECK_TTL_MS) {
        this.pendingChecks.delete(id);
        this.logger.warn(`Evicted stale pending check: ${id.slice(0, 8)}`);
      }
    }
  }
}
