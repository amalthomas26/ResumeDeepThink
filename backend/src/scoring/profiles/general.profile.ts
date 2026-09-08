import { ResumeTypeProfile } from './resume-type-profile.interface';

/**
 * General / Other resume profile (fallback).
 *
 * A conservative, broadly-applicable profile used when the user
 * doesn't pick a type or the resume doesn't clearly match one.
 * Per resume-type-handling.md: "never force a resume into a wrong-fit
 * category — a bad match is worse than a slightly generic score."
 */
export const generalProfile: ResumeTypeProfile = {
  id: 'general',
  label: 'General / Other',

  hardSkillKeywords: [
    // Office / productivity
    'microsoft office', 'excel', 'powerpoint', 'word', 'google workspace',
    'google sheets', 'outlook',
    // General professional
    'project management', 'data analysis', 'research', 'reporting',
    'budgeting', 'planning', 'scheduling', 'strategy',
    'process improvement', 'quality assurance',
    // Communication tools
    'slack', 'teams', 'zoom', 'jira', 'trello', 'asana', 'notion',
    // General technical
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
    // Percentage improvements
    /\b\d+[\d.]*\s*%/,
    // Currency amounts
    /[₹$€£]\s*\d[\d,.]*[KkMmBb]?\b/,
    // Team/people numbers
    /(?:team\s+of|led|managed|trained|supervised)\s+\d+/i,
    // Volume/count
    /\b\d[\d,.]*\+?\s*(?:projects?|clients?|accounts?|members?|employees?|reports?)\b/i,
    // General numeric improvement
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
