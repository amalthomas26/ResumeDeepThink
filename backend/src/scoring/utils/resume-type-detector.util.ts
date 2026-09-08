import { ParsedResume } from '../interfaces/parsed-resume.interface';
import { RESUME_TYPE_PROFILES } from '../profiles';

/**
 * Auto-detects the most likely resume type based on keyword density.
 *
 * Per resume-type-handling.md: "run a lightweight auto-detect
 * (keyword-density match against each profile) as a suggestion."
 *
 * Returns the profile ID with the highest match ratio, or 'general'
 * if no profile matches convincingly.
 */
export function detectResumeType(parsedResume: ParsedResume): string {
  const fullTextLower = parsedResume.fullText.toLowerCase();

  let bestId = 'general';
  let bestScore = 0;

  for (const [id, profile] of RESUME_TYPE_PROFILES) {
    if (id === 'general') continue; // Don't compete general against specifics

    const matchedKeywords = profile.hardSkillKeywords.filter((kw) => {
      const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = /^[a-z0-9]+$/i.test(kw)
        ? new RegExp(`\\b${escaped}\\b`, 'i')
        : new RegExp(`(?:^|[\\s,;|/])${escaped}(?:$|[\\s,;|/])`, 'i');
      return pattern.test(fullTextLower);
    });

    // Normalize by target to get a meaningful ratio
    const score = matchedKeywords.length / profile.keywordCoverageTarget;

    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  // Only return a specific type if the match is convincing
  // (at least 30% of the target keywords found)
  if (bestScore < 0.3) {
    return 'general';
  }

  return bestId;
}
