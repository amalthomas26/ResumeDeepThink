export interface ResumeTypeProfile {
    readonly id: 'tech' | 'finance' | 'support' | 'general';
    readonly label: string;
    readonly hardSkillKeywords: string[];
    readonly softSkillKeywords: string[];
    readonly expectedSections: string[];
    readonly impactMetricPatterns: RegExp[];
    readonly actionVerbBank: string[];
    readonly keywordCoverageTarget: number;
}
