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
  ForbiddenException,
  HttpCode,
  Logger,
  Sse,
  MessageEvent,
  OnModuleDestroy,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable, Subject } from 'rxjs';
import type { Request, Response } from 'express';
import { FileValidatorService } from './services/file-validator.service';
import { TextExtractorService } from './services/text-extractor.service';
import { ScoringService } from '../scoring/services/scoring.service';
import { ResumeParserService } from '../scoring/services/resume-parser.service';
import { AiInsightService } from '../ai-insight/services/ai-insight.service';
import { UsageService } from '../usage/services/usage.service';
import { DeviceIdentityService } from '../usage/services/device-identity.service';
import { AuthService } from '../auth/services/auth.service';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { ScoreBreakdown } from '../scoring/interfaces/rule-result.interface';
import { ExtractionResult } from './interfaces/extraction-result.interface';
import { CheckEvent } from './interfaces/check-event.interface';
import type { AuthPayload } from '../auth/interfaces/auth.interface';
import type { UsageStatus } from '../usage/interfaces/usage.interface';

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
  readonly experienceLevel: 'fresher' | 'experienced' | undefined;
  readonly extractionResult: ExtractionResult;
  readonly createdAt: number;
  readonly deviceId: string;
  readonly fingerprintHash: string;
  readonly userId: string | null;
}

/** Maximum age for a pending check before eviction (30 seconds). */
const PENDING_CHECK_TTL_MS = 30_000;

@Controller('resume')
@UseGuards(OptionalAuthGuard)
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
    private readonly resumeParser: ResumeParserService,
    private readonly aiInsightService: AiInsightService,
    private readonly usageService: UsageService,
    private readonly deviceIdentityService: DeviceIdentityService,
    private readonly authService: AuthService,
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
   * GET /resume/usage
   *
   * Returns the current device/user's usage status.
   * Per auth-and-tiers.md line 27: "have the frontend read the *result*
   * of an availability endpoint rather than re-implementing counting logic."
   */
  @Get('usage')
  getUsage(
    @Req() req: Request & { user?: AuthPayload },
    @Res({ passthrough: true }) res: Response,
  ): UsageStatus {
    const device = this.deviceIdentityService.extractIdentity(req, res);
    return this.usageService.checkAvailability(device, req.user?.sub);
  }

  /**
   * POST /resume/upload
   *
   * Per roadmap Phase 1: "single endpoint — upload → parse → run all
   * deterministic rules → return JSON score breakdown."
   *
   * Phase 3 addition: also calls AI insights synchronously.
   * Phase 4 addition: enforces usage limits.
   * Phase 5 addition: records check history.
   */
  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('resumeType') resumeType: string | undefined,
    @Body('experienceLevel') experienceLevel: 'fresher' | 'experienced' | undefined,
    @Req() req: Request & { user?: AuthPayload },
    @Res({ passthrough: true }) res: Response,
  ): Promise<ScoreBreakdown> {
    // 0. Check usage limits
    const device = this.deviceIdentityService.extractIdentity(req, res);
    const userId = req.user?.sub ?? null;
    this.enforceUsageLimit(device.deviceId, device.fingerprintHash, userId);

    // 1. Validate the file (magic bytes, size, extension)
    const { type } = this.fileValidator.validate(file);

    this.logger.log(
      `Processing ${type.toUpperCase()} upload: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`,
    );

    // 2. Extract text
    const extractionResult = await this.extractText(file, type);

    // Edge-case check: scanned/image-only PDF with no text layer
    this.checkScannedPdf(file, extractionResult);

    // 3. Validate resume type hint if provided
    this.validateResumeType(resumeType);

    // 4. Score the resume
    const scoreBreakdown = this.scoringService.score(
      extractionResult,
      resumeType,
      experienceLevel,
    );

    this.logger.log(
      `Scored ${file.originalname}: ${scoreBreakdown.overallScore}/100 (${scoreBreakdown.band}) in ${scoreBreakdown.meta.processingTimeMs}ms`,
    );

    // 5. Record usage + history
    this.usageService.recordCheck(device, userId ?? undefined);
    this.authService.recordCheckHistory(
      scoreBreakdown.checkId,
      userId,
      device.deviceId,
      scoreBreakdown.resumeType,
      scoreBreakdown.overallScore,
      scoreBreakdown.band,
      scoreBreakdown.bandLabel,
      file.originalname,
    );

    // 6. Generate AI insights (won't block deterministic score from being available)
    if (!extractionResult.isImageOnly) {
      const parsedResume = this.resumeParser.parse(
        extractionResult.text,
        extractionResult.pageCount,
      );

      const aiInsights = await this.aiInsightService.generateInsights(
        parsedResume,
        scoreBreakdown,
      );

      return { ...scoreBreakdown, aiInsights };
    }

    return scoreBreakdown;
  }

  /**
   * POST /resume/check
   *
   * Per architecture.md: "POST /resume/check kicks off processing and
   * immediately returns a checkId."
   */
  @Post('check')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
  async initiateCheck(
    @UploadedFile() file: Express.Multer.File,
    @Body('resumeType') resumeType: string | undefined,
    @Body('experienceLevel') experienceLevel: 'fresher' | 'experienced' | undefined,
    @Req() req: Request & { user?: AuthPayload },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ checkId: string }> {
    // 0. Check usage limits
    const device = this.deviceIdentityService.extractIdentity(req, res);
    const userId = req.user?.sub ?? null;
    this.enforceUsageLimit(device.deviceId, device.fingerprintHash, userId);

    // 1. Validate the file
    const { type } = this.fileValidator.validate(file);

    this.logger.log(
      `Initiating check for ${type.toUpperCase()}: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`,
    );

    // 2. Extract text (done upfront so SSE stream can start scoring immediately)
    const extractionResult = await this.extractText(file, type);

    // Edge-case check: scanned/image-only PDF with no text layer
    this.checkScannedPdf(file, extractionResult);

    // 3. Validate resume type hint if provided
    this.validateResumeType(resumeType);

    // 4. Generate checkId and store
    const checkId = crypto.randomUUID();
    this.pendingChecks.set(checkId, {
      file,
      resumeType,
      experienceLevel,
      extractionResult,
      createdAt: Date.now(),
      deviceId: device.deviceId,
      fingerprintHash: device.fingerprintHash,
      userId,
    });

    this.logger.log(`Check ${checkId.slice(0, 8)} initiated for ${file.originalname}`);

    return { checkId };
  }

  /**
   * GET /resume/check/:checkId/stream
   *
   * Per architecture.md: "Frontend opens GET /resume/check/:checkId/stream (SSE)."
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
      void this.runScoringWithInsights(
        checkId,
        pending,
        subject,
      );
    });

    return subject.asObservable();
  }

  // ─── Private helpers ─────────────────────────────────────────

  /**
   * Checks usage limit and throws ForbiddenException if over quota.
   *
   * Per architecture.md line 36: "Checks device fingerprint / user ID
   * against counters before FileIngestModule even runs, so you never
   * burn compute or AI cost on a request that's over quota."
   */
  private enforceUsageLimit(
    deviceId: string,
    fingerprintHash: string,
    userId: string | null,
  ): void {
    const status = this.usageService.checkAvailability(
      { deviceId, fingerprintHash },
      userId ?? undefined,
    );

    if (!status.allowed) {
      throw new ForbiddenException(
        `Daily check limit reached (${status.limit}/day). ` +
          'Your checks reset daily. Come back tomorrow!',
      );
    }
  }

  /**
   * Runs deterministic scoring with SSE progress events, then generates
   * AI insights as the final step before emitting the complete event.
   */
  private async runScoringWithInsights(
    checkId: string,
    pending: PendingCheck,
    subject: Subject<MessageEvent>,
  ): Promise<void> {
    try {
      // 1. Run deterministic scoring with per-rule SSE events
      const result = this.scoringService.scoreWithProgress(
        pending.extractionResult,
        pending.resumeType,
        (event) => {
          subject.next({
            data: event,
            type: event.type,
          });
        },
        pending.experienceLevel,
      );

      // Record usage + history
      const device = { deviceId: pending.deviceId, fingerprintHash: pending.fingerprintHash };
      this.usageService.recordCheck(device, pending.userId ?? undefined);
      this.authService.recordCheckHistory(
        checkId,
        pending.userId,
        pending.deviceId,
        result.resumeType,
        result.overallScore,
        result.band,
        result.bandLabel,
        pending.file.originalname,
      );

      // 2. Generate AI insights (the 3-4s latency step)
      let resultWithInsights: ScoreBreakdown = result;

      if (!pending.extractionResult.isImageOnly) {
        // Emit the "Generating personalized insights…" step-start
        const insightRuleId = 'ai-insights';
        const insightLabel = 'Generating personalized insights\u2026';

        subject.next({
          data: {
            type: 'step-start',
            ruleId: insightRuleId,
            category: 'AI Insights',
            label: insightLabel,
          },
          type: 'step-start',
        });

        // Parse resume for the AI service
        const parsedResume = this.resumeParser.parse(
          pending.extractionResult.text,
          pending.extractionResult.pageCount,
        );

        const aiInsights = await this.aiInsightService.generateInsights(
          parsedResume,
          result,
        );

        resultWithInsights = { ...result, aiInsights };

        // Emit step-complete for the insights step
        subject.next({
          data: {
            type: 'step-complete',
            ruleId: insightRuleId,
            category: 'AI Insights',
            label: insightLabel,
            severity: aiInsights.source === 'ai' ? 'pass' : 'warning',
            points: 0,
            maxPoints: 0,
            message:
              aiInsights.source === 'ai'
                ? 'AI insights generated successfully.'
                : 'Using general recommendations (AI insights unavailable).',
          },
          type: 'step-complete',
        });
      }

      // 3. Emit the final complete event with full result + AI insights
      const completeEvent: CheckEvent = {
        type: 'complete',
        result: resultWithInsights,
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
  }

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
    const validTypes = [
      'tech',
      'finance',
      'support',
      'general',
      'fresher',
      'marketing',
      'creative',
    ];
    if (resumeType && !validTypes.includes(resumeType)) {
      throw new BadRequestException(
        `Invalid resume type "${resumeType}". Valid types: ${validTypes.join(', ')}.`,
      );
    }
  }

  /**
   * Detects scanned/image-only PDFs per edge-cases.md.
   */
  private checkScannedPdf(
    file: Express.Multer.File,
    result: ExtractionResult,
  ): void {
    if (
      result.isImageOnly ||
      (file.size > 20_000 && result.text.trim().length < 40)
    ) {
      throw new BadRequestException(
        'We could not read text from this file — it appears to be a scanned image or non-selectable PDF. ' +
          'ATS systems cannot read scanned images without OCR. Please export your resume as a text-based PDF (Word → Save as PDF) and re-upload.',
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
