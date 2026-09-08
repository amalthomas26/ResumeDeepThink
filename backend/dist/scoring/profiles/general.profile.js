"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalProfile = void 0;
exports.generalProfile = {
    id: 'general',
    label: 'General / Other',
    hardSkillKeywords: [
        'microsoft office', 'excel', 'powerpoint', 'word', 'google workspace',
        'google sheets', 'outlook',
        'project management', 'data analysis', 'research', 'reporting',
        'budgeting', 'planning', 'scheduling', 'strategy',
        'process improvement', 'quality assurance',
        'slack', 'teams', 'zoom', 'jira', 'trello', 'asana', 'notion',
        'sql', 'python', 'excel', 'tableau', 'power bi', 'sap',
        'crm', 'erp', 'database management',
    ],
    softSkillKeywords: [
        'communication', 'leadership', 'teamwork', 'problem solving',
        'time management', 'organizational skills', 'adaptability',
        'critical thinking', 'creativity', 'attention to detail',
        'interpersonal', 'negotiation', 'public speaking', 'mentoring',
        'collaboration', 'decision making', 'analytical',
    ],
    expectedSections: ['summary', 'experience', 'education', 'skills'],
    impactMetricPatterns: [
        /\b\d+[\d.]*\s*%/,
        /[₹$€£]\s*\d[\d,.]*[KkMmBb]?\b/,
        /(?:team\s+of|led|managed|trained|supervised)\s+\d+/i,
        /\b\d[\d,.]*\+?\s*(?:projects?|clients?|accounts?|members?|employees?|reports?)\b/i,
        /(?:reduc|improv|increas|sav|generat)\w*\s+.*?\b\d+[\d.]*\b/i,
    ],
    actionVerbBank: [
        'achieved', 'administered', 'analyzed', 'built', 'collaborated',
        'communicated', 'coordinated', 'created', 'delivered', 'designed',
        'developed', 'directed', 'drove', 'established', 'executed',
        'facilitated', 'generated', 'guided', 'implemented', 'improved',
        'initiated', 'introduced', 'led', 'managed', 'mentored',
        'negotiated', 'optimized', 'organized', 'oversaw', 'planned',
        'presented', 'produced', 'reduced', 'resolved', 'revamped',
        'spearheaded', 'streamlined', 'supervised', 'supported',
        'trained', 'transformed', 'updated',
    ],
    keywordCoverageTarget: 5,
};
//# sourceMappingURL=general.profile.js.map