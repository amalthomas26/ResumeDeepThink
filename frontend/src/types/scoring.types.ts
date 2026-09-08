/**
 * Shared TypeScript interfaces matching the backend API contract exactly.
 * Single source of truth — no inline interface duplication across components.
 *
 * These types mirror the backend's rule-result.interface.ts and
 * check-event.interface.ts definitions.
 */

// ─── Score Breakdown Types ─────────────────────────────────────

export interface RuleResult {
  readonly id: string;
  readonly category: string;
  readonly passed: boolean;
  readonly points: number;
  readonly maxPoints: number;
  readonly message: string;
  readonly severity: 'pass' | 'warning' | 'fail';
}

export interface CategoryResult {
  readonly name: string;
  readonly earnedPoints: number;
  readonly maxPoints: number;
  readonly rules: RuleResult[];
}

export type ScoreBand = 'strong' | 'workable' | 'at-risk' | 'high-risk';

export interface ScoreBreakdown {
  readonly checkId: string;
  readonly overallScore: number;
  readonly maxScore: number;
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

// ─── SSE Event Types ───────────────────────────────────────────

export interface StepStartEvent {
  readonly type: 'step-start';
  readonly ruleId: string;
  readonly category: string;
  readonly label: string;
}

export interface StepCompleteEvent {
  readonly type: 'step-complete';
  readonly ruleId: string;
  readonly category: string;
  readonly label: string;
  readonly severity: 'pass' | 'warning' | 'fail';
  readonly points: number;
  readonly maxPoints: number;
  readonly message: string;
}

export interface CheckCompleteEvent {
  readonly type: 'complete';
  readonly result: ScoreBreakdown;
}

export interface CheckErrorEvent {
  readonly type: 'error';
  readonly message: string;
}

export type CheckEvent =
  | StepStartEvent
  | StepCompleteEvent
  | CheckCompleteEvent
  | CheckErrorEvent;

// ─── Store Types ───────────────────────────────────────────────

export type CheckPhase = 'idle' | 'uploading' | 'scanning' | 'results' | 'error';

/** A completed step in the scanning checklist. */
export interface CompletedStep {
  readonly ruleId: string;
  readonly category: string;
  readonly label: string;
  readonly severity: 'pass' | 'warning' | 'fail';
}
