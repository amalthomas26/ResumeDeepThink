import { AiInsightResult } from '../../ai-insight/interfaces/ai-insight.interface';
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
    readonly experienceLevel?: 'fresher' | 'experienced';
    readonly profileSuggestion?: {
        readonly typeId: string;
        readonly label: string;
        readonly reason: string;
    } | null;
    readonly aiInsights?: AiInsightResult | null;
    readonly warnings?: string[];
    readonly isNonEnglish?: boolean;
    readonly isMultiResumeAnomaly?: boolean;
}
