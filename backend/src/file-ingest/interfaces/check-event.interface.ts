/**
 * SSE event types for real-time scoring progress.
 *
 * Per architecture.md: "emit one event per rule as it completes, then a final
 * complete event with the full score + AI insights."
 */

/**
 * Emitted when a scoring step begins processing.
 */
export interface StepStartEvent {
  readonly type: 'step-start';
  readonly ruleId: string;
  readonly category: string;
  readonly label: string;
}

/**
 * Emitted when a scoring step finishes, carrying its result.
 */
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

/**
 * Terminal event: full score breakdown ready.
 */
export interface CheckCompleteEvent {
  readonly type: 'complete';
  readonly result: import('../../scoring/interfaces/rule-result.interface').ScoreBreakdown;
}

/**
 * Terminal event: scoring failed.
 */
export interface CheckErrorEvent {
  readonly type: 'error';
  readonly message: string;
}

export type CheckEvent =
  | StepStartEvent
  | StepCompleteEvent
  | CheckCompleteEvent
  | CheckErrorEvent;
