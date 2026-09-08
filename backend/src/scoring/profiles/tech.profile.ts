import { ResumeTypeProfile } from './resume-type-profile.interface';

/**
 * Tech resume profile.
 *
 * Hard skills: languages, frameworks, cloud, DevOps, databases.
 * Impact patterns: latency/performance numbers, uptime %, user/scale figures.
 * Common failure: skills dumped as unstructured paragraph (bootcamp/self-taught).
 */
export const techProfile: ResumeTypeProfile = {
  id: 'tech',
  label: 'Technology / Software Engineering',

  hardSkillKeywords: [
    // Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
    'ruby', 'php', 'swift', 'kotlin', 'scala', 'r',
    // Frontend
    'react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'html', 'css',
    'tailwind', 'sass', 'webpack', 'vite',
    // Backend
    'node.js', 'express', 'nestjs', 'django', 'flask', 'spring', 'fastapi',
    'graphql', 'rest', 'grpc', 'microservices',
    // Databases
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'dynamodb', 'cassandra', 'firebase',
    // Cloud & DevOps
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'jenkins',
    'ci/cd', 'github actions', 'gitlab ci', 'ansible',
    // Data / ML
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas',
    'numpy', 'spark', 'kafka', 'airflow',
    // General
    'git', 'linux', 'agile', 'scrum', 'jira', 'api', 'testing',
    'unit testing', 'integration testing', 'tdd',
  ],

  softSkillKeywords: [
    'leadership', 'mentoring', 'collaboration', 'communication',
    'problem solving', 'critical thinking', 'project management',
    'time management', 'adaptability', 'teamwork', 'cross-functional',
  ],

  expectedSections: ['summary', 'experience', 'education', 'skills'],

  impactMetricPatterns: [
    // Latency / performance: "reduced latency by 40%", "improved load time by 2s"
    /(?:reduc|improv|optimiz|decreas|increas)\w*\s+.*?\b\d+[\d.]*\s*(%|ms|seconds?|s)\b/i,
    // Uptime: "99.9% uptime", "maintained 99.99% availability"
    /\b\d{2,3}\.?\d*\s*%\s*(?:uptime|availability|SLA)\b/i,
    // Scale: "served 1M users", "handled 10K requests/sec"
    /\b\d[\d,.]*\s*[KkMmBb]?\+?\s*(?:users?|requests?|transactions?|records?|rows?|events?)\b/i,
    // Team size: "led a team of 8", "managed 12 engineers"
    /(?:team\s+of|led|managed)\s+\d+/i,
    // General numbers with percentage
    /\b\d+[\d.]*\s*%/,
    // Dollar/rupee amounts
    /[₹$€£]\s*\d[\d,.]*[KkMmBb]?\b/,
    // Bare quantifiers: "5x improvement", "3x faster"
    /\b\d+x\s+(?:faster|improvement|reduction|increase)/i,
  ],

  actionVerbBank: [
    'architected', 'built', 'coded', 'configured', 'debugged', 'deployed',
    'designed', 'developed', 'engineered', 'implemented', 'integrated',
    'launched', 'maintained', 'migrated', 'modularized', 'optimized',
    'orchestrated', 'programmed', 'provisioned', 'refactored', 'released',
    'resolved', 'scaled', 'scripted', 'shipped', 'simplified',
    'spearheaded', 'streamlined', 'tested', 'transformed', 'upgraded',
    'automated', 'containerized', 'instrumented', 'monitored', 'profiled',
    'analyzed', 'created', 'delivered', 'led', 'managed', 'mentored',
    'collaborated', 'contributed', 'established', 'introduced', 'pioneered',
  ],

  keywordCoverageTarget: 8,
};
