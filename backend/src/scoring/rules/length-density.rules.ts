import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';

const CATEGORY = 'Length & Density';

/**
 * Infers approximate experience level from date ranges in the resume.
 * Returns estimated years of experience, or null if not determinable.
 */
function inferExperienceYears(parsedResume: ParsedResume): number | null {
  const currentYear = new Date().getFullYear();
  let earliestYear: number | null = null;

  for (const entry of parsedResume.experienceEntries) {
    const dateStr = entry.startDate || entry.endDate;
    if (!dateStr) continue;

    // Extract year from various formats: "2015", "Jan 2015", "01/2015"
    const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      if (earliestYear === null || year < earliestYear) {
        earliestYear = year;
      }
    }
  }

  if (earliestYear === null) return null;
  return currentYear - earliestYear;
}

/**
 * Returns word count boundaries [min, max] based on inferred experience level.
 * Per spec: "a 1-page resume for 12 years of experience or a 3-page resume
 * for a fresher are both flagged, in opposite directions."
 */
function getWordCountRange(
  experienceYears: number | null,
  experienceLevel?: string,
): {
  min: number;
  max: number;
  level: string;
} {
  if (experienceLevel === 'fresher') {
    return { min: 150, max: 600, level: 'fresher / entry-level' };
  }
  if (experienceYears === null) {
    // Can't infer — use the broadest reasonable range
    return { min: 150, max: 1400, level: 'unknown' };
  }
  if (experienceYears <= 2) {
    return { min: 150, max: 600, level: 'entry-level' };
  }
  if (experienceYears <= 7) {
    return { min: 350, max: 1000, level: 'mid-level' };
  }
  // Senior: 8+ years
  return { min: 500, max: 1400, level: 'senior' };
}

/**
 * Rule: word-count-in-range (5 pts)
 * Checks word count against experience-level-appropriate bounds.
 * Per edge-cases.md: distinguish "sparse fresher resume" from "bad resume."
 */
export function checkWordCountInRange(
  parsedResume: ParsedResume,
  experienceLevel?: string,
): RuleResult {
  const maxPoints = 5;
  const wordCount = parsedResume.wordCount;
  const experienceYears = inferExperienceYears(parsedResume);
  const { min, max, level } = getWordCountRange(experienceYears, experienceLevel);

  let points: number;
  let message: string;
  let severity: 'pass' | 'warning' | 'fail';

  if (wordCount >= min && wordCount <= max) {
    points = maxPoints;
    message = `Resume length (${wordCount} words) is appropriate${level !== 'unknown' ? ` for ${level} experience` : ''}.`;
    severity = 'pass';
  } else if (wordCount < min) {
    // Under-length: scale points by how close to min
    const ratio = wordCount / min;
    points = Math.round(Math.max(0, ratio * maxPoints));

    if (wordCount < 50) {
      // Essentially empty — per edge case doc, distinct messaging
      message = 'Resume appears nearly empty. Add your experience, skills, and education to create a complete resume.';
      severity = 'fail';
    } else {
      message = `Resume is short (${wordCount} words)${level !== 'unknown' ? ` for ${level} experience (expected ${min}-${max} words)` : ''}. Consider adding more detail about your experience and accomplishments.`;
      severity = 'warning';
    }
  } else {
    // Over-length
    const overRatio = max / wordCount;
    points = Math.round(Math.max(0, overRatio * maxPoints));
    message = `Resume is long (${wordCount} words)${level !== 'unknown' ? ` for ${level} experience (expected ${min}-${max} words)` : ''}. Consider being more concise — ATS ranking favors density over volume.`;
    severity = 'warning';
  }

  return {
    id: 'word-count-in-range',
    category: CATEGORY,
    passed: points === maxPoints,
    points,
    maxPoints,
    message,
    severity,
  };
}

/**
 * Rule: no-blank-sections (5 pts)
 * Detects large whitespace gaps, near-empty sections, or overall sparse content.
 */
export function checkNoBlankSections(parsedResume: ParsedResume): RuleResult {
  const maxPoints = 5;

  // Check for near-empty resume overall
  if (parsedResume.wordCount < 30) {
    return {
      id: 'no-blank-sections',
      category: CATEGORY,
      passed: false,
      points: 0,
      maxPoints,
      message: 'Resume content is essentially empty. A complete resume needs substantive content in experience, skills, and education sections.',
      severity: 'fail',
    };
  }

  // Check for sections with very little content (< 10 words)
  const emptySections: string[] = [];
  for (const section of parsedResume.sections) {
    const sectionWords = section.content.trim().split(/\s+/).filter(Boolean);
    if (sectionWords.length < 10 && section.type !== 'unknown') {
      emptySections.push(section.headerText || section.type);
    }
  }

  // Check for large blank gaps (many consecutive empty lines)
  const lines = parsedResume.fullText.split('\n');
  let maxConsecutiveEmpty = 0;
  let currentEmpty = 0;
  for (const line of lines) {
    if (line.trim().length === 0) {
      currentEmpty++;
      maxConsecutiveEmpty = Math.max(maxConsecutiveEmpty, currentEmpty);
    } else {
      currentEmpty = 0;
    }
  }

  const hasBlankGaps = maxConsecutiveEmpty >= 5;
  const hasEmptySections = emptySections.length > 0;

  let points: number;
  let message: string;
  let severity: 'pass' | 'warning' | 'fail';

  if (!hasBlankGaps && !hasEmptySections) {
    points = maxPoints;
    message = 'No blank sections or large gaps detected.';
    severity = 'pass';
  } else {
    const issues: string[] = [];
    if (hasEmptySections) {
      issues.push(`Near-empty sections detected: ${emptySections.join(', ')}`);
    }
    if (hasBlankGaps) {
      issues.push('Large blank gaps found in the document');
    }
    points = hasEmptySections && hasBlankGaps ? 0 : 2;
    message = `${issues.join('. ')}. Fill in all sections with substantive content.`;
    severity = points === 0 ? 'fail' : 'warning';
  }

  return {
    id: 'no-blank-sections',
    category: CATEGORY,
    passed: points === maxPoints,
    points,
    maxPoints,
    message,
    severity,
  };
}

/**
 * Runs all Length & Density rules (10 pts total).
 */
export function runLengthDensityRules(
  parsedResume: ParsedResume,
  experienceLevel?: string,
): RuleResult[] {
  return [
    checkWordCountInRange(parsedResume, experienceLevel),
    checkNoBlankSections(parsedResume),
  ];
}
