"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeProfile = void 0;
exports.financeProfile = {
    id: 'finance',
    label: 'Finance / Accounting',
    hardSkillKeywords: [
        'excel', 'advanced excel', 'vlookup', 'pivot tables', 'macros', 'vba',
        'sap', 'tally', 'quickbooks', 'xero', 'power bi', 'tableau',
        'bloomberg terminal', 'reuters', 'hyperion', 'oracle financials',
        'reconciliation', 'variance analysis', 'p&l', 'profit and loss',
        'balance sheet', 'cash flow', 'forecasting', 'budgeting',
        'financial modeling', 'valuation', 'dcf', 'financial analysis',
        'audit', 'internal audit', 'external audit', 'compliance',
        'risk management', 'credit analysis', 'portfolio management',
        'accounts payable', 'accounts receivable', 'general ledger',
        'journal entries', 'month-end close', 'year-end close',
        'financial reporting', 'gaap', 'ifrs', 'sox',
        'gst', 'tds', 'income tax', 'tds returns', 'gst returns',
        'transfer pricing', 'direct tax', 'indirect tax',
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
        /[₹$€£]\s*\d[\d,.]*\s*(?:[KkMmBbLlCcTt](?:r|illion|akh|rore)?)?\b/i,
        /\b\d+[\d.]*\s*%/,
        /(?:portfolio|budget|fund|assets?)\s+(?:of|worth|valued at)\s+[₹$€£]?\s*\d[\d,.]*[KkMmBb]?\b/i,
        /\b\d[\d,.]*\+?\s*(?:invoices?|accounts?|transactions?|clients?|reports?)\b/i,
        /(?:team\s+of|led|managed|supervised)\s+\d+/i,
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
//# sourceMappingURL=finance.profile.js.map