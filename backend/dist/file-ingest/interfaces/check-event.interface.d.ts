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
    readonly result: import('../../scoring/interfaces/rule-result.interface').ScoreBreakdown;
}
export interface CheckErrorEvent {
    readonly type: 'error';
    readonly message: string;
}
export type CheckEvent = StepStartEvent | StepCompleteEvent | CheckCompleteEvent | CheckErrorEvent;
