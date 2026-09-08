import { ResumeTypeProfile } from './resume-type-profile.interface';

/**
 * Fresher / College Graduate resume profile.
 *
 * Tailored for students, recent graduates, and entry-level candidates (0-1 yrs).
 * Expected sections emphasize Projects, Skills, and Education rather than commercial Experience.
 * Bullet quality rewards academic projects, open-source, hackathons, and internship impact.
 */
export const fresherProfile: ResumeTypeProfile = {
  id: 'fresher',
  label: 'Fresher / College Graduate (All Domains)',
  isFresherProfile: true,

  hardSkillKeywords: [
    // Core Engineering & Programming
    'python', 'java', 'c++', 'c', 'javascript', 'typescript', 'sql', 'html', 'css',
    // Web & Frameworks
    'react', 'node.js', 'express', 'django', 'flask', 'spring boot', 'tailwind', 'bootstrap',
    // Databases & Cloud
    'mysql', 'postgresql', 'mongodb', 'sqlite', 'firebase', 'git', 'github', 'linux',
    // Core CS Concepts
    'data structures', 'algorithms', 'dsa', 'oops', 'object oriented programming',
    'dbms', 'operating systems', 'computer networks', 'rest api', 'system design',
    // Emerging & Specialized
    'machine learning', 'data analysis', 'pandas', 'numpy', 'scikit-learn', 'docker',
  ],

  softSkillKeywords: [
    'problem solving', 'quick learner', 'communication', 'teamwork', 'collaboration',
    'adaptability', 'analytical thinking', 'curiosity', 'time management', 'work ethic',
  ],

  // For freshers, Projects takes precedence over corporate Experience
  expectedSections: ['education', 'skills', 'projects'],

  impactMetricPatterns: [
    // Project scale / users: "built app used by 300+ students", "500+ downloads"
    /\b\d+\+?\s*(?:users?|students?|downloads?|visitors?|requests?|queries|stars?)\b/i,
    // Hackathon / Competition rankings: "secured 1st place", "top 5 out of 200 teams"
    /\b(?:top\s+\d+|1st|2nd|3rd|\d+(?:st|nd|rd|th)\s+place|rank(?:ed)?\s+\d+)\b/i,
    // Accuracy / Performance: "94% accuracy", "reduced execution time by 35%"
    /\b\d{1,3}(?:\.\d+)?\s*%\s*(?:accuracy|precision|efficiency|faster|speedup|reduction|increase|improvement)\b/i,
    // Academic metrics: CGPA, GPA, percentage
    /\b(?:cgpa|gpa)\s*(?:of|:)?\s*\d(?:\.\d+)?(?:\s*\/\s*10|\s*\/\s*4)?/i,
    // General percentage
    /\b\d+[\d.]*\s*%/,
    // Team size in academic/hackathon projects: "team of 4"
    /(?:team\s+of|led\s+a\s+team\s+of)\s+\d+/i,
  ],

  actionVerbBank: [
    'built', 'developed', 'designed', 'implemented', 'created', 'engineered',
    'programmed', 'deployed', 'configured', 'integrated', 'optimized',
    'solved', 'architected', 'tested', 'debugged', 'collaborated',
    'contributed', 'authored', 'researched', 'analyzed', 'launched',
    'trained', 'formulated', 'automated', 'delivered', 'established',
  ],

  keywordCoverageTarget: 6,
};
