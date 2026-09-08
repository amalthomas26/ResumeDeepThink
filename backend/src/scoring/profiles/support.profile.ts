import { ResumeTypeProfile } from './resume-type-profile.interface';

/**
 * Customer Support / Ops resume profile.
 *
 * Hard skills: tools (Zendesk, Freshdesk, Salesforce, Intercom),
 * metrics vocabulary (CSAT, NPS, SLA, first-response time, ticket volume).
 * Common failure: heavy on soft-skill adjectives, almost no quantified impact.
 * This profile weights quantified impact more heavily in messaging.
 */
export const supportProfile: ResumeTypeProfile = {
  id: 'support',
  label: 'Customer Support / Operations',

  hardSkillKeywords: [
    // Tools
    'zendesk', 'freshdesk', 'salesforce', 'salesforce service cloud',
    'intercom', 'hubspot', 'zoho', 'jira', 'confluence', 'slack',
    'microsoft teams', 'servicenow', 'helpscout', 'crisp', 'drift',
    'livechat', 'chatbot',
    // Metrics vocabulary
    'csat', 'nps', 'sla', 'first response time', 'first call resolution',
    'ticket volume', 'resolution rate', 'escalation rate', 'churn rate',
    'customer retention', 'average handling time', 'aht',
    // Domain terms
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
    // CSAT/NPS: "maintained 95% CSAT", "improved NPS from 40 to 65"
    /\b\d+[\d.]*\s*%?\s*(?:CSAT|NPS|satisfaction)\b/i,
    // Ticket volume: "resolved 500+ tickets/month", "handled 80 tickets/day"
    /\b\d[\d,.]*\+?\s*(?:tickets?|cases?|calls?|issues?|queries?)(?:\s*\/\s*(?:day|week|month))?\b/i,
    // Resolution time: "reduced response time to under 2 hours"
    /(?:response|resolution|handling)\s+time\s+.*?\b\d+[\d.]*\s*(?:hours?|minutes?|min|hrs?|%)\b/i,
    // Escalation rates: "reduced escalation by 30%"
    /\b\d+[\d.]*\s*%/,
    // Team size
    /(?:team\s+of|led|managed|trained|supervised|mentored)\s+\d+/i,
    // Volume/scale
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
