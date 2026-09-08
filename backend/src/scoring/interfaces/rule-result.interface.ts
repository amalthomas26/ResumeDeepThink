/**
 * Result of a single scoring rule execution.
 * Each rule returns partial credit where appropriate — not just pass/fail.
 */
export interface RuleResult {
  /** Unique identifier, e.g. 'file-format-valid' */
  readonly id: string;

  /** Human-readable category name, e.g. 'File & Format Integrity' */
  readonly category: string;

  /** True only when full marks are earned */
  readonly passed: boolean;

  /** Actual points earned (supports partial credit) */
  readonly points: number;

  /** Maximum possible points for this rule */
  readonly maxPoints: number;

  /** Human-readable explanation shown to the user */
  readonly message: string;

  /** Visual severity indicator */
  readonly severity: 'pass' | 'warning' | 'fail';
}

/**
 * Aggregated result for a rule category (e.g. "Contact & Identity Parsing").
 */
export interface CategoryResult {
  readonly name: string;
  readonly earnedPoints: number;
  readonly maxPoints: number;
  readonly rules: RuleResult[];
}

/** Score band identifiers per ats-scoring-engine.md */
export type ScoreBand = 'strong' | 'workable' | 'at-risk' | 'high-risk';

/**
 * The complete score breakdown returned from the scoring endpoint.
 */
export interface ScoreBreakdown {
  readonly checkId: string;
  readonly overallScore: number;
  readonly maxScore: 100;
  readonly band: ScoreBand;
  readonly bandLabel: string;
  readonly resumeType: string;
  readonly categories: CategoryResult[];
  readonly ruleResults: RuleResult[];
  readonly meta: {
    readonly wordCount: number;
    readonly pageCount: number;
    readonly processingTimeMs: number;
  };
}
