import { ParsedResume } from '../interfaces/parsed-resume.interface';

/**
 * Anomaly Detection Utility
 *
 * Implements edge-case anomaly checks from edge-cases.md:
 * "Multiple resumes' worth of content pasted/merged into one file (rare but happens):
 * if parsed length is wildly outside normal bounds with duplicate section headers
 * detected, flag distinctly rather than scoring as one confused resume."
 */

export interface MultiResumeAnomalyResult {
  readonly isMultiResume: boolean;
  readonly reason?: string;
  readonly detectedDuplicates?: string[];
}

// Regex for extracting all distinct emails in document
const ALL_EMAILS_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/**
 * Detects whether a document likely contains multiple merged or concatenated resumes.
 */
export function detectMultiResumeAnomaly(parsedResume: ParsedResume): MultiResumeAnomalyResult {
  const { wordCount, pageCount, sections, fullText } = parsedResume;

  // Normal resumes rarely exceed 1,400 words even for senior executives.
  // Wildly outside normal bounds starts at ~1,800+ words or >= 5 pages with > 1,400 words.
  const isWildlyLong = wordCount >= 1800 || (pageCount >= 5 && wordCount >= 1400);

  // Count occurrences of major section types
  const sectionCounts = new Map<string, number>();
  for (const s of sections) {
    if (s.confidence >= 0.6 && s.content.trim().length > 80) {
      const count = sectionCounts.get(s.type) || 0;
      sectionCounts.set(s.type, count + 1);
    }
  }

  const duplicateSections: string[] = [];
  for (const [type, count] of sectionCounts.entries()) {
    if (count >= 2 && (type === 'experience' || type === 'education' || type === 'skills' || type === 'summary')) {
      duplicateSections.push(`${count}x ${type}`);
    }
  }

  // Count distinct email addresses in the full text
  const rawEmails = fullText.match(ALL_EMAILS_REGEX) || [];
  const uniqueEmails = Array.from(new Set(rawEmails.map((e) => e.toLowerCase())));

  // Conditions for multi-resume anomaly:
  // 1. Wildly long length + at least one duplicate core section (e.g. 2 Experience sections or 2 Education sections)
  // 2. Wildly long length + multiple distinct contact emails (suggesting 2 different people's resumes pasted)
  // 3. Very extreme length (> 2,500 words) with multiple duplicated sections
  const hasMultipleCoreDuplicates = duplicateSections.length >= 2;
  const hasWildLengthAndDuplicate = isWildlyLong && duplicateSections.length >= 1;
  const hasWildLengthAndMultipleEmails = isWildlyLong && uniqueEmails.length >= 2;
  const isExtremeLengthCompilation = wordCount > 2500 && duplicateSections.length >= 1;

  if (hasWildLengthAndDuplicate || hasWildLengthAndMultipleEmails || isExtremeLengthCompilation || (hasMultipleCoreDuplicates && wordCount > 1500)) {
    const reasons: string[] = [];
    if (duplicateSections.length > 0) {
      reasons.push(`duplicate section blocks detected (${duplicateSections.join(', ')})`);
    }
    if (uniqueEmails.length >= 2) {
      reasons.push(`multiple distinct contact emails found (${uniqueEmails.slice(0, 2).join(', ')})`);
    }
    reasons.push(`unusually large document length (${wordCount.toLocaleString()} words, ${pageCount} pages)`);

    return {
      isMultiResume: true,
      reason: `Potential multi-resume merge or unedited compilation detected: ${reasons.join('; ')}. ATS parsers expect a single candidate resume and will become confused by merged dossiers. Please upload each resume individually for an accurate score.`,
      detectedDuplicates: duplicateSections,
    };
  }

  return {
    isMultiResume: false,
  };
}
