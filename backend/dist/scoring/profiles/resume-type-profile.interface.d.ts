export interface ResumeTypeProfile {
    readonly id: 'tech' | 'finance' | 'support' | 'general' | 'fresher' | 'marketing' | 'creative';
    readonly label: string;
    readonly isFresherProfile?: boolean;
    readonly hardSkillKeywords: string[];
    readonly softSkillKeywords: string[];
    readonly expectedSections: string[];
    readonly impactMetricPatterns: RegExp[];
    readonly actionVerbBank: string[];
    readonly keywordCoverageTarget: number;
}
