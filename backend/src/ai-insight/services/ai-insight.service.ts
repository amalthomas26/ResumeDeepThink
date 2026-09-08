import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PromptBuilderService } from './prompt-builder.service';
import { FallbackTipsService } from './fallback-tips.service';
import {
  AiInsightResult,
  AI_INSIGHT_JSON_SCHEMA,
} from '../interfaces/ai-insight.interface';
import { validateInsightResponse } from '../validators/insight-response.validator';
import { ParsedResume } from '../../scoring/interfaces/parsed-resume.interface';
import { ScoreBreakdown } from '../../scoring/interfaces/rule-result.interface';

/** Hard timeout for the Gemini API call (per ai-integration.md: 8-10s). */
const GEMINI_TIMEOUT_MS = 10_000;

/** Default model when GEMINI_MODEL env var is not set. */
const DEFAULT_MODEL = 'gemini-3.5-flash';

/**
 * AiInsightService — the orchestrator for Gemini-based qualitative insights.
 *
 * Per architecture.md: "calls Gemini for qualitative insights, validates
 * the response shape before trusting it."
 *
 * Responsibilities:
 * 1. Call Gemini with structured output schema
 * 2. Validate the response shape (custom validator, not Zod)
 * 3. Retry once on validation failure with a stricter prompt
 * 4. Fall back to static tips on total failure
 *
 * The deterministic score NEVER depends on this service succeeding.
 */
@Injectable()
export class AiInsightService {
  private readonly logger = new Logger(AiInsightService.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly fallbackTips: FallbackTipsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model = this.configService.get<string>('GEMINI_MODEL') || DEFAULT_MODEL;

    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
      this.logger.log(`Gemini client initialized with model: ${this.model}`);
    } else {
      this.client = null;
      this.logger.warn(
        'GEMINI_API_KEY not set — AI insights will use static fallback tips.',
      );
    }
  }

  /**
   * Generates AI insights for a scored resume.
   *
   * Returns structured insights on success, or static fallback tips
   * when the API key is missing, the call times out, or the response
   * fails validation after the retry budget.
   */
  async generateInsights(
    parsedResume: ParsedResume,
    scoreBreakdown: ScoreBreakdown,
  ): Promise<AiInsightResult> {
    // No API key → immediate fallback (graceful degradation)
    if (!this.client) {
      this.logger.debug('No Gemini client — returning fallback tips.');
      return this.fallbackTips.generateFallbackTips(scoreBreakdown.categories);
    }

    const systemPrompt = this.promptBuilder.buildSystemPrompt(
      scoreBreakdown.resumeType,
      scoreBreakdown.experienceLevel,
    );
    const userContent = this.promptBuilder.buildUserContent(
      parsedResume,
      scoreBreakdown,
    );

    // Attempt 1
    const firstAttempt = await this.callGemini(systemPrompt, userContent);
    if (firstAttempt) {
      return firstAttempt;
    }

    // Attempt 2 — stricter prompt (per ai-integration.md: "retry once with a stricter prompt")
    this.logger.warn('First Gemini attempt failed — retrying with stricter prompt.');
    const stricterSystemPrompt =
      systemPrompt +
      '\n\nCRITICAL: Your previous response did not match the required JSON schema. ' +
      'You MUST return valid JSON with exactly these top-level keys: "bottlenecks" (array), ' +
      '"fixes" (array), "summary" (string). Each bottleneck must have "category", "issue", ' +
      '"severity" (one of "high", "medium", "low"). Each fix must have "category", "action", "example". ' +
      'Do NOT include any text outside the JSON object.';

    const secondAttempt = await this.callGemini(stricterSystemPrompt, userContent);
    if (secondAttempt) {
      return secondAttempt;
    }

    // Both attempts failed — fall back to static tips
    this.logger.error(
      'Both Gemini attempts failed — returning static fallback tips.',
    );
    return this.fallbackTips.generateFallbackTips(scoreBreakdown.categories);
  }

  /**
   * Makes a single Gemini API call with timeout and response validation.
   *
   * @returns Validated AiInsightResult or null on any failure.
   */
  private async callGemini(
    systemPrompt: string,
    userContent: string,
  ): Promise<AiInsightResult | null> {
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      GEMINI_TIMEOUT_MS,
    );

    try {
      const response = await this.client!.models.generateContent({
        model: this.model,
        contents: userContent,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: AI_INSIGHT_JSON_SCHEMA,
        },
        // @ts-expect-error -- AbortSignal support varies by SDK version
        signal: abortController.signal,
      });

      clearTimeout(timeout);

      const text = response.text;
      if (!text) {
        this.logger.warn('Gemini returned empty text response.');
        return null;
      }

      // Parse the JSON response
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        this.logger.warn('Gemini response was not valid JSON.');
        return null;
      }

      // Validate the shape (custom validator, not Zod)
      const validated = validateInsightResponse(parsed);
      if (!validated) {
        this.logger.warn('Gemini response failed shape validation.');
        return null;
      }

      this.logger.log(
        `AI insights generated: ${validated.bottlenecks.length} bottlenecks, ${validated.fixes.length} fixes.`,
      );
      return validated;
    } catch (error: unknown) {
      clearTimeout(timeout);

      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn(
          `Gemini call timed out after ${GEMINI_TIMEOUT_MS}ms.`,
        );
      } else {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Gemini call failed: ${message}`);
      }

      return null;
    }
  }
}
