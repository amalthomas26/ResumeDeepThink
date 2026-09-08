import { ResumeTypeProfile } from './resume-type-profile.interface';

/**
 * UI/UX & Creative Design resume profile.
 *
 * Focuses on user-centered design, design systems, research methods, and measurable UX improvements.
 */
export const creativeProfile: ResumeTypeProfile = {
  id: 'creative',
  label: 'UI/UX & Creative Design',

  hardSkillKeywords: [
    // Core Tools
    'figma', 'adobe xd', 'sketch', 'photoshop', 'illustrator', 'indesign', 'after effects',
    'framer', 'invision', 'miro', 'zeplin',
    // UX & Research Methods
    'user research', 'usability testing', 'wireframing', 'prototyping', 'user interviews',
    'information architecture', 'user journey', 'journey mapping', 'persona', 'user flows',
    'card sorting', 'heuristic evaluation', 'a/b testing', 'design thinking',
    // UI & Visual Design
    'design systems', 'component library', 'typography', 'color theory', 'visual design',
    'interaction design', 'responsive design', 'micro-interactions', 'accessibility',
    'wcag', 'html', 'css',
  ],

  softSkillKeywords: [
    'empathy', 'user advocacy', 'collaboration', 'presentation skills',
    'creative problem solving', 'active listening', 'adaptability', 'storytelling',
  ],

  expectedSections: ['skills', 'projects', 'experience', 'education'],

  impactMetricPatterns: [
    // Usability / satisfaction metrics: "improved SUS score by 25%", "CSAT increased to 92%"
    /(?:improv|increas|boost)\w*\s+.*?\b\d+[\d.]*\s*%\b/i,
    // Task completion / time: "reduced task completion time by 40%"
    /(?:reduc|decreas|cut)\w*\s+.*?\b\d+[\d.]*\s*(?:%|seconds?|minutes?|s)\b/i,
    // System scale: "built 120+ components in Figma design system", "adopted by 15 teams"
    /\b\d+\+?\s*(?:components?|screens?|templates?|teams?|users?|interviews?)\b/i,
    // General percentage
    /\b\d+[\d.]*\s*%/,
  ],

  actionVerbBank: [
    'designed', 'prototyped', 'wireframed', 'conceptualized', 'crafted',
    'revamped', 'standardized', 'conducted', 'researched', 'moderated',
    'iterated', 'illustrated', 'facilitated', 'architected', 'unified',
    'synthesized', 'visualized', 'mapped', 'tested', 'delivered',
  ],

  keywordCoverageTarget: 8,
};
