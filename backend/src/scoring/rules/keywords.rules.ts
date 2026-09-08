import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';
import { ResumeTypeProfile } from '../profiles/resume-type-profile.interface';

/**
 * Matches a keyword against text using word boundaries.
 * Prevents false matches like 'r' matching inside 'resume'.
 * Handles keywords with special regex chars (e.g. 'c++', 'c#', 'node.js').
 */
function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = escapeRegex(keyword);
  // For keywords with special chars (c++, c#, node.js), use looser boundaries
  const pattern = /^[a-z0-9]+$/i.test(keyword)
    ? new RegExp(`\\b${escaped}\\b`, 'i')
    : new RegExp(`(?:^|[\\s,;|/])${escaped}(?:$|[\\s,;|/])`, 'i');
  return pattern.test(text);
}

const CATEGORY = 'Keyword & Skills Alignment';

/**
 * Rule: skills-section-parseable (5 pts)
 * Skills section exists AND parses into discrete items (not prose).
 *
 * Heuristic: a parseable skills list is comma-, pipe-, or newline-delimited
 * with short items (mostly 1-3 words each). A prose paragraph has long
 * "items" (sentences) and no clear delimiters.
 */
export function checkSkillsSectionParseable(
  parsedResume: ParsedResume,
): RuleResult {
  const maxPoints = 5;

  const skillsSection = parsedResume.sections.find((s) => s.type === 'skills');

  if (!skillsSection) {
    return {
      id: 'skills-section-parseable',
      category: CATEGORY,
      passed: false,
      points: 0,
      maxPoints,
      message: 'No Skills section found. ATS systems specifically index the Skills section — add one with your key competencies listed clearly.',
      severity: 'fail',
    };
  }

  // Check if skills parsed into discrete items
  const skillsList = parsedResume.skillsList;

  if (skillsList.length === 0) {
    return {
      id: 'skills-section-parseable',
      category: CATEGORY,
      passed: false,
      points: 0,
      maxPoints,
      message: 'Skills section found but could not parse individual skills from it. Format your skills as a comma-separated or bulleted list, not a prose paragraph.',
      severity: 'fail',
    };
  }

  // Check if items look like discrete skills (short) vs prose sentences (long)
  const avgItemLength = skillsList.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / skillsList.length;
  const isProse = avgItemLength > 5; // Skills items rarely exceed 4-5 words

  if (isProse) {
    return {
      id: 'skills-section-parseable',
      category: CATEGORY,
      passed: false,
      points: 2, // Partial: section exists but poorly formatted
      maxPoints,
      message: 'Skills section appears to be written as prose rather than a discrete list. ATS systems parse individual skill tokens — reformat as a comma-separated or bulleted list.',
      severity: 'warning',
    };
  }

  return {
    id: 'skills-section-parseable',
    category: CATEGORY,
    passed: true,
    points: maxPoints,
    maxPoints,
    message: `Skills section found with ${skillsList.length} discrete skills identified.`,
    severity: 'pass',
  };
}

/**
 * Rule: keyword-coverage (15 pts)
 * Proportional: match resume text against hard + soft skill keywords
 * from the active ResumeTypeProfile.
 * Soft skills weighted at 0.5x.
 * Score = (effectiveMatches / keywordCoverageTarget) * 15, capped at 15.
 */
export function checkKeywordCoverage(
  parsedResume: ParsedResume,
  profile: ResumeTypeProfile,
): RuleResult {
  const maxPoints = 15;
  const fullTextLower = parsedResume.fullText.toLowerCase();

  // Count hard skill matches (1.0 weight each)
  const matchedHard = profile.hardSkillKeywords.filter((keyword) =>
    matchesKeyword(fullTextLower, keyword.toLowerCase()),
  );

  // Count soft skill matches (0.5 weight each)
  const matchedSoft = profile.softSkillKeywords.filter((keyword) =>
    matchesKeyword(fullTextLower, keyword.toLowerCase()),
  );

  const effectiveMatches = matchedHard.length + matchedSoft.length * 0.5;
  const target = profile.keywordCoverageTarget;
  const ratio = Math.min(effectiveMatches / target, 1);
  const points = Math.round(ratio * maxPoints);

  let message: string;
  if (points === maxPoints) {
    message = `Strong keyword coverage: ${matchedHard.length} hard skills and ${matchedSoft.length} soft skills matched for ${profile.label}.`;
  } else if (points >= 8) {
    message = `Moderate keyword coverage: ${matchedHard.length} hard skills matched. Consider adding more ${profile.label}-specific technical terms.`;
  } else {
    message = `Low keyword coverage for ${profile.label}: only ${matchedHard.length} relevant hard skills found. ATS systems rank candidates by keyword match — review the job posting for required skills.`;
  }

  return {
    id: 'keyword-coverage',
    category: CATEGORY,
    passed: points === maxPoints,
    points,
    maxPoints,
    message,
    severity: points === maxPoints ? 'pass' : points >= 8 ? 'warning' : 'fail',
  };
}

/**
 * Rule: no-keyword-stuffing (5 pts)
 * Detect abnormal keyword density: any single keyword appearing 5+ times,
 * or skills list exceeding 50 items, or abnormal repetition patterns.
 * Penalize, don't reward.
 */
export function checkNoKeywordStuffing(
  parsedResume: ParsedResume,
  profile: ResumeTypeProfile,
): RuleResult {
  const maxPoints = 5;
  const fullTextLower = parsedResume.fullText.toLowerCase();
  const stuffingSignals: string[] = [];

  // Check 1: Any keyword repeated 5+ times
  const allKeywords = [
    ...profile.hardSkillKeywords,
    ...profile.softSkillKeywords,
  ];

  for (const keyword of allKeywords) {
    const escaped = escapeRegex(keyword.toLowerCase());
    const pattern = /^[a-z0-9]+$/i.test(keyword)
      ? new RegExp(`\\b${escaped}\\b`, 'gi')
      : new RegExp(`(?:^|[\\s,;|/])${escaped}(?:$|[\\s,;|/])`, 'gi');
    const matches = fullTextLower.match(pattern);
    if (matches && matches.length >= 5) {
      stuffingSignals.push(`"${keyword}" appears ${matches.length} times`);
    }
  }

  // Check 2: Skills list exceeding 50 items
  if (parsedResume.skillsList.length > 50) {
    stuffingSignals.push(
      `Skills list contains ${parsedResume.skillsList.length} items (unusually large)`,
    );
  }

  // Check 3: Detect repeated phrases (any 2+ word phrase appearing 4+ times)
  const wordSequences = fullTextLower.match(/\b[a-z]+(?:\s+[a-z]+){1,2}\b/g) || [];
  const phraseCount = new Map<string, number>();
  for (const phrase of wordSequences) {
    phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1);
  }
  for (const [phrase, count] of phraseCount) {
    if (count >= 4 && phrase.split(/\s+/).length >= 2) {
      // Ignore very common phrases
      const commonPhrases = ['such as', 'as well', 'in the', 'of the', 'and the', 'to the', 'for the'];
      if (!commonPhrases.includes(phrase)) {
        stuffingSignals.push(`Phrase "${phrase}" repeated ${count} times`);
      }
    }
  }

  const isStuffed = stuffingSignals.length > 0;
  const points = isStuffed ? 0 : maxPoints;

  return {
    id: 'no-keyword-stuffing',
    category: CATEGORY,
    passed: !isStuffed,
    points,
    maxPoints,
    message: isStuffed
      ? `Keyword stuffing detected: ${stuffingSignals.slice(0, 3).join('; ')}. ATS systems penalize or flag abnormal keyword repetition.`
      : 'No keyword stuffing detected.',
    severity: isStuffed ? 'fail' : 'pass',
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Runs all Keyword & Skills rules (25 pts total).
 */
export function runKeywordRules(
  parsedResume: ParsedResume,
  profile: ResumeTypeProfile,
): RuleResult[] {
  return [
    checkSkillsSectionParseable(parsedResume),
    checkKeywordCoverage(parsedResume, profile),
    checkNoKeywordStuffing(parsedResume, profile),
  ];
}
