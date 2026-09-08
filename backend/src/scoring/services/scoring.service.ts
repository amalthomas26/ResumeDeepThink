import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RuleResult, CategoryResult, ScoreBreakdown } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';
import { ExtractionResult } from '../../file-ingest/interfaces/extraction-result.interface';
import { ResumeParserService } from './resume-parser.service';
import { ResumeTypeProfile } from '../profiles/resume-type-profile.interface';
import { getResumeTypeProfile } from '../profiles';
import { getScoreBand } from '../utils/score-band.util';
import { runFileFormatRules } from '../rules/file-format.rules';
import { runContactRules } from '../rules/contact.rules';
import { runStructureRules } from '../rules/structure.rules';
import { runKeywordRules } from '../rules/keywords.rules';
import { runExperienceRules } from '../rules/experience.rules';
import { runLengthDensityRules } from '../rules/length-density.rules';
import { detectResumeType } from '../utils/resume-type-detector.util';
import {
  StepStartEvent,
  StepCompleteEvent,
} from '../../file-ingest/interfaces/check-event.interface';

/**
 * Human-readable labels for each rule id, shown in the loading-screen
 * checklist per architecture.md: "emit the 15-20 deterministic rule names
 * as discrete progress events."
 */
const RULE_LABELS: ReadonlyMap<string, string> = new Map([
  // File & Format Integrity
  ['file-is-valid-document', 'Validating document format'],
  ['text-layer-extractable', 'Checking text layer'],
  ['no-encoding-issues', 'Scanning for encoding problems'],
  // Contact & Identity Parsing
  ['name-detected', 'Detecting your name'],
  ['email-present-valid', 'Looking for email address'],
  ['phone-present', 'Looking for phone number'],
  ['linkedin-or-portfolio', 'Scanning for profile URLs'],
  // Structural Parsing
  ['standard-sections-detected', 'Analyzing section structure'],
  ['no-multi-column-layout', 'Checking page layout'],
  ['no-tables-or-textboxes', 'Detecting tables and text boxes'],
  // Keyword & Skills Alignment
  ['skills-section-parseable', 'Parsing skills section'],
  ['keyword-coverage', 'Evaluating keyword coverage'],
  ['no-keyword-stuffing', 'Checking for keyword stuffing'],
  // Experience Quality Signals
  ['dates-present-consistent', 'Analyzing date formatting'],
  ['action-verbs-used', 'Evaluating action verbs'],
  ['quantified-impact', 'Measuring quantified impact'],
  // Length & Density
  ['word-count-appropriate', 'Checking resume length'],
  ['no-blank-sections', 'Scanning for empty sections'],
]);

/** Callback signature for per-rule progress events. */
export type RuleProgressCallback = (
  event: StepStartEvent | StepCompleteEvent,
) => void;

/**
 * A single category's rule-runner: a function that returns RuleResult[].
 * Used internally to iterate over categories with progress emission.
 */
interface RuleCategoryRunner {
  readonly categoryLabel: string;
  readonly run: () => RuleResult[];
}

/**
 * ScoringService — the orchestrator.
 *
 * Runs all deterministic rule categories in order, sums scores,
 * assigns a band label, and returns the complete ScoreBreakdown.
 *
 * Per architecture.md: "pure functions, each independently unit-testable."
 * This service wires them together; each rule file is independently testable.
 */
@Injectable()
export class ScoringService {
  constructor(private readonly resumeParser: ResumeParserService) {}

  /**
   * Scores a resume given its extraction result and an optional resume type hint.
   *
   * If the resume is image-only, returns a short-circuit result per edge-cases.md:
   * "Do not silently score an empty resume as if it were bad content."
   */
  score(
    extractionResult: ExtractionResult,
    resumeTypeHint?: string,
  ): ScoreBreakdown {
    const startTime = Date.now();
    const checkId = randomUUID();

    // Short-circuit: image-only PDF
    if (extractionResult.isImageOnly) {
      return this.buildImageOnlyResult(checkId, extractionResult, startTime);
    }

    // Parse the raw text into structured data
    const parsedResume = this.resumeParser.parse(
      extractionResult.text,
      extractionResult.pageCount,
    );

    // Resolve the resume type profile
    const detectedType = detectResumeType(parsedResume);
    const effectiveType = resumeTypeHint || detectedType;
    const profile = getResumeTypeProfile(effectiveType);

    // Run all rule categories in order (matches the loading-screen steps)
    const allRuleResults: RuleResult[] = [
      ...runFileFormatRules(extractionResult),
      ...runContactRules(parsedResume),
      ...runStructureRules(parsedResume, profile),
      ...runKeywordRules(parsedResume, profile),
      ...runExperienceRules(parsedResume, profile),
      ...runLengthDensityRules(parsedResume),
    ];

    // Group by category
    const categories = this.groupByCategory(allRuleResults);

    // Sum total score
    const overallScore = allRuleResults.reduce((sum, r) => sum + r.points, 0);
    const { band, label: bandLabel } = getScoreBand(
      Math.min(100, Math.max(0, overallScore)),
    );

    const processingTimeMs = Date.now() - startTime;

    return {
      checkId,
      overallScore: Math.min(100, Math.max(0, overallScore)),
      maxScore: 100,
      band,
      bandLabel,
      resumeType: profile.id,
      categories,
      ruleResults: allRuleResults,
      meta: {
        wordCount: parsedResume.wordCount,
        pageCount: parsedResume.pageCount,
        processingTimeMs,
      },
    };
  }

  /**
   * Scores a resume with per-rule progress callbacks.
   *
   * Same logic as score(), but calls onProgress before and after each rule,
   * allowing the controller to emit SSE events. Open/Closed: the core scoring
   * logic is unchanged; this method only adds the observation layer.
   */
  scoreWithProgress(
    extractionResult: ExtractionResult,
    resumeTypeHint: string | undefined,
    onProgress: RuleProgressCallback,
  ): ScoreBreakdown {
    const startTime = Date.now();
    const checkId = randomUUID();

    // Short-circuit: image-only PDF
    if (extractionResult.isImageOnly) {
      return this.buildImageOnlyResult(checkId, extractionResult, startTime);
    }

    // Parse the raw text into structured data
    const parsedResume = this.resumeParser.parse(
      extractionResult.text,
      extractionResult.pageCount,
    );

    // Resolve the resume type profile
    const detectedType = detectResumeType(parsedResume);
    const effectiveType = resumeTypeHint || detectedType;
    const profile = getResumeTypeProfile(effectiveType);

    // Build category runners in execution order
    const categoryRunners: RuleCategoryRunner[] = [
      {
        categoryLabel: 'File & Format Integrity',
        run: () => runFileFormatRules(extractionResult),
      },
      {
        categoryLabel: 'Contact & Identity Parsing',
        run: () => runContactRules(parsedResume),
      },
      {
        categoryLabel: 'Structural Parsing',
        run: () => runStructureRules(parsedResume, profile),
      },
      {
        categoryLabel: 'Keyword & Skills Alignment',
        run: () => runKeywordRules(parsedResume, profile),
      },
      {
        categoryLabel: 'Experience Quality Signals',
        run: () => runExperienceRules(parsedResume, profile),
      },
      {
        categoryLabel: 'Length & Density',
        run: () => runLengthDensityRules(parsedResume),
      },
    ];

    // Execute each category, emitting per-rule events
    const allRuleResults: RuleResult[] = [];

    for (const runner of categoryRunners) {
      const results = runner.run();

      for (const rule of results) {
        const label =
          RULE_LABELS.get(rule.id) ?? `Checking ${rule.id}`;

        // Emit step-start
        onProgress({
          type: 'step-start',
          ruleId: rule.id,
          category: rule.category,
          label,
        });

        // Emit step-complete (rule already ran synchronously above)
        onProgress({
          type: 'step-complete',
          ruleId: rule.id,
          category: rule.category,
          label,
          severity: rule.severity,
          points: rule.points,
          maxPoints: rule.maxPoints,
          message: rule.message,
        });

        allRuleResults.push(rule);
      }
    }

    // Group by category
    const categories = this.groupByCategory(allRuleResults);

    // Sum total score
    const overallScore = allRuleResults.reduce((sum, r) => sum + r.points, 0);
    const { band, label: bandLabel } = getScoreBand(
      Math.min(100, Math.max(0, overallScore)),
    );

    const processingTimeMs = Date.now() - startTime;

    return {
      checkId,
      overallScore: Math.min(100, Math.max(0, overallScore)),
      maxScore: 100,
      band,
      bandLabel,
      resumeType: profile.id,
      categories,
      ruleResults: allRuleResults,
      meta: {
        wordCount: parsedResume.wordCount,
        pageCount: parsedResume.pageCount,
        processingTimeMs,
      },
    };
  }

  /**
   * Groups rule results into CategoryResult objects.
   */
  private groupByCategory(rules: RuleResult[]): CategoryResult[] {
    const categoryMap = new Map<string, RuleResult[]>();

    for (const rule of rules) {
      const existing = categoryMap.get(rule.category) || [];
      existing.push(rule);
      categoryMap.set(rule.category, existing);
    }

    return Array.from(categoryMap.entries()).map(([name, categoryRules]) => ({
      name,
      earnedPoints: categoryRules.reduce((sum, r) => sum + r.points, 0),
      maxPoints: categoryRules.reduce((sum, r) => sum + r.maxPoints, 0),
      rules: categoryRules,
    }));
  }

  /**
   * Builds a short-circuit result for image-only PDFs.
   * Per edge-cases.md: distinct result state, not a nonsensical near-zero score.
   */
  private buildImageOnlyResult(
    checkId: string,
    extractionResult: ExtractionResult,
    startTime: number,
  ): ScoreBreakdown {
    const fileFormatResults = runFileFormatRules(extractionResult);

    return {
      checkId,
      overallScore: 0,
      maxScore: 100,
      band: 'high-risk',
      bandLabel: 'Unable to score — scanned/image-only document',
      resumeType: 'general',
      categories: [
        {
          name: 'File & Format Integrity',
          earnedPoints: fileFormatResults.reduce((s, r) => s + r.points, 0),
          maxPoints: fileFormatResults.reduce((s, r) => s + r.maxPoints, 0),
          rules: fileFormatResults,
        },
      ],
      ruleResults: fileFormatResults,
      meta: {
        wordCount: 0,
        pageCount: extractionResult.pageCount,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }
}
