import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume, SectionType } from '../interfaces/parsed-resume.interface';
import { ResumeTypeProfile } from '../profiles/resume-type-profile.interface';

const CATEGORY = 'Structural Parsing';

/**
 * Rule: standard-sections-detected (10 pts)
 * Proportional: (foundSections / expectedSections) * 10.
 * Expected sections come from the active ResumeTypeProfile.
 */
export function checkStandardSectionsDetected(
  parsedResume: ParsedResume,
  profile: ResumeTypeProfile,
  experienceLevel?: string,
): RuleResult {
  const maxPoints = 10;
  const isFresher =
    experienceLevel === 'fresher' || profile.isFresherProfile === true;

  let expectedSections = [...profile.expectedSections];
  const foundSectionTypes = new Set(
    parsedResume.sections
      .filter((s) => s.confidence >= 0.5) // Only count confident matches
      .map((s) => s.type),
  );

  // For freshers: if experience is missing but projects is present, projects satisfies it
  if (isFresher && expectedSections.includes('experience') && !foundSectionTypes.has('experience')) {
    expectedSections = expectedSections.map((s) => (s === 'experience' ? 'projects' : s));
  }

  const matchedCount = expectedSections.filter((expected) =>
    foundSectionTypes.has(expected as SectionType),
  ).length;

  const ratio = expectedSections.length > 0
    ? matchedCount / expectedSections.length
    : 1;
  const points = Math.round(ratio * maxPoints);

  const missingSections = expectedSections.filter(
    (s) => !foundSectionTypes.has(s as SectionType),
  );

  let message: string;
  if (points === maxPoints) {
    message = `All expected sections found: ${expectedSections.join(', ')}.`;
  } else if (matchedCount > 0) {
    message = `Found ${matchedCount} of ${expectedSections.length} expected sections. Missing: ${missingSections.join(', ')}. ATS systems look for standard section headers to categorize your content.`;
  } else {
    message = `Could not identify any standard section headers. ATS systems rely on headers like "Experience", "Education", "Skills", "Projects" to parse your resume correctly.`;
  }

  return {
    id: 'standard-sections-detected',
    category: CATEGORY,
    passed: points === maxPoints,
    points,
    maxPoints,
    message,
    severity: points === maxPoints ? 'pass' : points >= 5 ? 'warning' : 'fail',
  };
}

/**
 * Rule: no-multi-column-layout (5 pts)
 * Heuristic detection of column-like layout from extracted text.
 *
 * Signals:
 * 1. High ratio of short lines (< 40 chars) that aren't bullet points or headers.
 * 2. Lines with large mid-line whitespace gaps (3+ spaces) suggesting side-by-side content.
 * 3. Alternating short-long-short line length patterns typical of jumbled columns.
 */
export function checkNoMultiColumnLayout(parsedResume: ParsedResume): RuleResult {
  const maxPoints = 5;
  const lines = parsedResume.fullText.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length < 5) {
    // Too few lines to meaningfully detect columns
    return {
      id: 'no-multi-column-layout',
      category: CATEGORY,
      passed: true,
      points: maxPoints,
      maxPoints,
      message: 'No multi-column layout detected.',
      severity: 'pass',
    };
  }

  let columnSignals = 0;
  const totalLines = lines.length;

  // Signal 1: High ratio of abnormally short lines
  const shortLineCount = lines.filter((l) => l.trim().length > 0 && l.trim().length < 40).length;
  const shortLineRatio = shortLineCount / totalLines;
  if (shortLineRatio > 0.6) {
    columnSignals += 2;
  }

  // Signal 2: Lines with large mid-line gaps (tab or 3+ spaces between words)
  const midGapPattern = /\S\s{3,}\S/;
  const midGapCount = lines.filter((l) => midGapPattern.test(l)).length;
  const midGapRatio = midGapCount / totalLines;
  if (midGapRatio > 0.15) {
    columnSignals += 2;
  }

  // Signal 3: High variance in line lengths (columns produce erratic lengths)
  const lineLengths = lines.map((l) => l.trim().length);
  const avgLength = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
  const variance =
    lineLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
    lineLengths.length;
  const coeffOfVariation = Math.sqrt(variance) / (avgLength || 1);
  if (coeffOfVariation > 1.2) {
    columnSignals += 1;
  }

  const isMultiColumn = columnSignals >= 2;
  const points = isMultiColumn ? 0 : maxPoints;

  return {
    id: 'no-multi-column-layout',
    category: CATEGORY,
    passed: !isMultiColumn,
    points,
    maxPoints,
    message: isMultiColumn
      ? 'Possible multi-column layout detected. Most ATS systems read left-to-right across the full page width, which jumbles two-column resumes into nonsense. Use a single-column layout for best compatibility.'
      : 'No multi-column layout detected.',
    severity: isMultiColumn ? 'fail' : 'pass',
  };
}

/**
 * Rule: no-tables-or-textboxes (5 pts)
 * Detects table-like structures from extraction artifacts.
 *
 * Signals:
 * 1. Pipe-delimited content (common table remnant in text extraction)
 * 2. Tab-heavy lines (table cell separators)
 * 3. Repeated horizontal line patterns (---|---) from table borders
 */
export function checkNoTablesOrTextboxes(parsedResume: ParsedResume): RuleResult {
  const maxPoints = 5;
  const lines = parsedResume.fullText.split('\n');

  let tableSignals = 0;

  // Signal 1: Pipe-delimited lines (| cell | cell |)
  const pipeLineCount = lines.filter((l) => {
    const pipeCount = (l.match(/\|/g) || []).length;
    return pipeCount >= 2; // At least 2 pipes suggests a table row
  }).length;
  if (pipeLineCount >= 3) {
    tableSignals += 2;
  }

  // Signal 2: Tab-heavy lines (2+ tabs in a single line)
  const tabLineCount = lines.filter((l) => {
    const tabCount = (l.match(/\t/g) || []).length;
    return tabCount >= 2;
  }).length;
  if (tabLineCount >= 3) {
    tableSignals += 2;
  }

  // Signal 3: Horizontal rule / border patterns
  const borderLineCount = lines.filter((l) =>
    /^[\s\-_=+|]{5,}$/.test(l.trim()),
  ).length;
  if (borderLineCount >= 2) {
    tableSignals += 1;
  }

  const hasTables = tableSignals >= 2;
  const points = hasTables ? 0 : maxPoints;

  return {
    id: 'no-tables-or-textboxes',
    category: CATEGORY,
    passed: !hasTables,
    points,
    maxPoints,
    message: hasTables
      ? 'Table or text-box structure detected. Many ATS parsers skip text inside tables and text boxes entirely. Move your content into plain paragraphs and bullet lists.'
      : 'No tables or text boxes detected.',
    severity: hasTables ? 'fail' : 'pass',
  };
}

/**
 * Runs all Structural Parsing rules (20 pts total).
 */
export function runStructureRules(
  parsedResume: ParsedResume,
  profile: ResumeTypeProfile,
  experienceLevel?: string,
): RuleResult[] {
  return [
    checkStandardSectionsDetected(parsedResume, profile, experienceLevel),
    checkNoMultiColumnLayout(parsedResume),
    checkNoTablesOrTextboxes(parsedResume),
  ];
}
