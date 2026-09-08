import { ResumeTypeProfile } from './resume-type-profile.interface';

/**
 * Finance / Accounting resume profile.
 *
 * Hard skills: tools (Excel, SAP, Tally, QuickBooks, Power BI),
 * domain terms (reconciliation, variance analysis, P&L, forecasting,
 * audit, compliance, GST/TDS for Indian roles).
 * Certifications (CA, CFA, CPA, MBA-Finance) as a distinct expected section.
 * Impact patterns: currency figures, percentage-based metrics, portfolio sizes.
 */
export const financeProfile: ResumeTypeProfile = {
  id: 'finance',
  label: 'Finance / Accounting',

  hardSkillKeywords: [
    // Tools
    'excel', 'advanced excel', 'vlookup', 'pivot tables', 'macros', 'vba',
    'sap', 'tally', 'quickbooks', 'xero', 'power bi', 'tableau',
    'bloomberg terminal', 'reuters', 'hyperion', 'oracle financials',
    // Domain terms
    'reconciliation', 'variance analysis', 'p&l', 'profit and loss',
    'balance sheet', 'cash flow', 'forecasting', 'budgeting',
    'financial modeling', 'valuation', 'dcf', 'financial analysis',
    'audit', 'internal audit', 'external audit', 'compliance',
    'risk management', 'credit analysis', 'portfolio management',
    'accounts payable', 'accounts receivable', 'general ledger',
    'journal entries', 'month-end close', 'year-end close',
    'financial reporting', 'gaap', 'ifrs', 'sox',
    // India-specific
    'gst', 'tds', 'income tax', 'tds returns', 'gst returns',
    'transfer pricing', 'direct tax', 'indirect tax',
    // Certifications (also checked as section)
    'ca', 'cfa', 'cpa', 'cma', 'mba', 'acca', 'frm',
  ],

  softSkillKeywords: [
    'attention to detail', 'analytical', 'problem solving',
    'communication', 'stakeholder management', 'presentation',
    'leadership', 'team management', 'negotiation', 'decision making',
    'time management', 'organizational skills', 'integrity',
  ],

  expectedSections: ['summary', 'experience', 'education', 'skills', 'certifications'],

  impactMetricPatterns: [
    // Currency figures: "$2M portfolio", "₹50L budget", "€1.5M"
    /[₹$€£]\s*\d[\d,.]*\s*(?:[KkMmBbLlCcTt](?:r|illion|akh|rore)?)?\b/i,
    // Percentage metrics: "reduced costs by 15%", "improved accuracy to 99.8%"
    /\b\d+[\d.]*\s*%/,
    // Portfolio/budget sizes: "managed a portfolio of 500 clients"
    /(?:portfolio|budget|fund|assets?)\s+(?:of|worth|valued at)\s+[₹$€£]?\s*\d[\d,.]*[KkMmBb]?\b/i,
    // Volume: "processed 1000+ invoices", "handled 200 accounts"
    /\b\d[\d,.]*\+?\s*(?:invoices?|accounts?|transactions?|clients?|reports?)\b/i,
    // Team size
    /(?:team\s+of|led|managed|supervised)\s+\d+/i,
    // Time improvements: "reduced close time from 10 days to 5"
    /(?:reduc|improv|cut|slash|decreas)\w*\s+.*?\b\d+[\d.]*\s*(?:days?|hours?|%)\b/i,
  ],

  actionVerbBank: [
    'analyzed', 'audited', 'balanced', 'budgeted', 'calculated', 'closed',
    'compiled', 'consolidated', 'controlled', 'decreased', 'evaluated',
    'examined', 'filed', 'forecasted', 'identified', 'improved',
    'investigated', 'managed', 'maximized', 'minimized', 'monitored',
    'optimized', 'oversaw', 'planned', 'prepared', 'processed',
    'projected', 'reconciled', 'reduced', 'reported', 'restructured',
    'reviewed', 'saved', 'standardized', 'streamlined', 'supervised',
    'tracked', 'verified', 'assessed', 'automated', 'delivered',
    'developed', 'established', 'implemented', 'led', 'presented',
    'spearheaded', 'transformed', 'validated',
  ],

  keywordCoverageTarget: 7,
};
