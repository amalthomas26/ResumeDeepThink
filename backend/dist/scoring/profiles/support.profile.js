"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportProfile = void 0;
exports.supportProfile = {
    id: 'support',
    label: 'Customer Support / Operations',
    hardSkillKeywords: [
        'zendesk', 'freshdesk', 'salesforce', 'salesforce service cloud',
        'intercom', 'hubspot', 'zoho', 'jira', 'confluence', 'slack',
        'microsoft teams', 'servicenow', 'helpscout', 'crisp', 'drift',
        'livechat', 'chatbot',
        'csat', 'nps', 'sla', 'first response time', 'first call resolution',
        'ticket volume', 'resolution rate', 'escalation rate', 'churn rate',
        'customer retention', 'average handling time', 'aht',
        'customer support', 'customer service', 'technical support',
        'help desk', 'troubleshooting', 'onboarding', 'training',
        'knowledge base', 'documentation', 'sop', 'process improvement',
        'quality assurance', 'workforce management', 'scheduling',
        'crm', 'ticketing system', 'live chat', 'phone support',
        'email support', 'escalation management',
    ],
    softSkillKeywords: [
        'empathy', 'patience', 'communication', 'active listening',
        'conflict resolution', 'problem solving', 'multitasking',
        'adaptability', 'teamwork', 'leadership', 'de-escalation',
        'customer-centric', 'interpersonal', 'positive attitude',
        'stress management', 'time management',
    ],
    expectedSections: ['summary', 'experience', 'education', 'skills'],
    impactMetricPatterns: [
        /\b\d+[\d.]*\s*%?\s*(?:CSAT|NPS|satisfaction)\b/i,
        /\b\d[\d,.]*\+?\s*(?:tickets?|cases?|calls?|issues?|queries?)(?:\s*\/\s*(?:day|week|month))?\b/i,
        /(?:response|resolution|handling)\s+time\s+.*?\b\d+[\d.]*\s*(?:hours?|minutes?|min|hrs?|%)\b/i,
        /\b\d+[\d.]*\s*%/,
        /(?:team\s+of|led|managed|trained|supervised|mentored)\s+\d+/i,
        /\b\d[\d,.]*\+?\s*(?:customers?|users?|accounts?|clients?)\b/i,
    ],
    actionVerbBank: [
        'assisted', 'coached', 'communicated', 'coordinated', 'de-escalated',
        'delivered', 'documented', 'empowered', 'facilitated', 'guided',
        'handled', 'improved', 'investigated', 'maintained', 'managed',
        'mediated', 'mentored', 'monitored', 'onboarded', 'organized',
        'prioritized', 'processed', 'reduced', 'resolved', 'responded',
        'retained', 'served', 'streamlined', 'supported', 'trained',
        'triaged', 'troubleshot', 'updated', 'verified', 'achieved',
        'analyzed', 'automated', 'built', 'created', 'developed',
        'established', 'implemented', 'introduced', 'led', 'optimized',
        'revamped', 'spearheaded', 'transformed',
    ],
    keywordCoverageTarget: 6,
};
//# sourceMappingURL=support.profile.js.map