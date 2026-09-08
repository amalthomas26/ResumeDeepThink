import { ResumeTypeProfile } from './resume-type-profile.interface';

/**
 * Marketing / Growth / SEO resume profile.
 *
 * Emphasizes performance marketing, analytics, conversion metrics, and campaign ROI.
 */
export const marketingProfile: ResumeTypeProfile = {
  id: 'marketing',
  label: 'Marketing / Growth / SEO',

  hardSkillKeywords: [
    // Digital & Performance Marketing
    'seo', 'sem', 'google ads', 'meta ads', 'facebook ads', 'performance marketing',
    'growth marketing', 'digital marketing', 'content marketing', 'email marketing',
    'social media marketing', 'affiliate marketing', 'influencer marketing',
    // Tools & Platforms
    'google analytics', 'ga4', 'google search console', 'hubspot', 'mailchimp',
    'semrush', 'ahrefs', 'canva', 'wordpress', 'marketo', 'salesforce', 'zapier',
    // Conversion & Analytics
    'conversion rate optimization', 'cro', 'a/b testing', 'funnel optimization',
    'lead generation', 'customer acquisition', 'market research', 'copywriting',
    'campaign management', 'brand strategy', 'cac', 'ltv', 'roas', 'ctr', 'cpc',
  ],

  softSkillKeywords: [
    'storytelling', 'creativity', 'communication', 'strategic thinking',
    'analytical skills', 'cross-functional collaboration', 'stakeholder management',
    'relationship building', 'time management', 'adaptability',
  ],

  expectedSections: ['summary', 'experience', 'skills', 'education'],

  impactMetricPatterns: [
    // Growth / Traffic metrics: "grew organic traffic by 120%", "increased CTR by 4.5%"
    /(?:increas|grew|boost|improv|scal)\w*\s+.*?\b\d+[\d.]*\s*%\b/i,
    // ROI / ROAS: "3.5x ROAS", "4x ROI"
    /\b\d+(?:\.\d+)?x\s*(?:roas|roi|return)\b/i,
    // Audience / Followers / Traffic numbers: "100K visitors", "50K followers"
    /\b\d[\d,.]*\s*[KkMmBb]?\+?\s*(?:visitors?|users?|followers?|subscribers?|impressions?|leads?|signups?)\b/i,
    // Revenue / Budget: "$50K monthly budget", "₹20L revenue generated"
    /[₹$€£]\s*\d[\d,.]*[KkMmBb]?\b/,
    // CAC / Cost reduction: "reduced CAC by 30%"
    /(?:reduc|decreas|cut)\w*\s+.*?\b\d+[\d.]*\s*%\b/i,
    // General percentage
    /\b\d+[\d.]*\s*%/,
  ],

  actionVerbBank: [
    'spearheaded', 'launched', 'drove', 'scaled', 'optimized', 'generated',
    'increased', 'accelerated', 'amplified', 'boosted', 'orchestrated',
    'managed', 'executed', 'authored', 'curated', 'negotiated',
    'formulated', 'devised', 'pioneered', 'expanded', 'cultivated',
    'analyzed', 'tested', 'monitored', 'collaborated', 'delivered',
  ],

  keywordCoverageTarget: 8,
};
