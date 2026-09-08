import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';
import { ResumeTypeProfile } from '../profiles/resume-type-profile.interface';

const CATEGORY = 'Experience Quality Signals';
const BULLET_REGEX = /^[\s]*(?:[-•●○■►▸▹→⊳⊲]|\*|–|—|\d+[.)]\s)/;

/**
 * Extracts bullet points for evaluation.
 * For experienced profiles: checks experience entries first.
 * For freshers or if experience entries are empty: includes project section bullets.
 */
function extractEvaluationBullets(
  parsedResume: ParsedResume,
  isFresher: boolean,
): { bullets: string[]; source: 'experience' | 'projects' | 'both' } {
  const expBullets = parsedResume.experienceEntries.flatMap((e) => e.bullets);
  const projBullets: string[] = [];

  const projectSections = parsedResume.sections.filter(
    (s) => s.type === 'projects',
  );

  for (const section of projectSections) {
    const lines = section.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (BULLET_REGEX.test(trimmed)) {
        const cleaned = trimmed.replace(BULLET_REGEX, '').trim();
        if (cleaned.length > 0) projBullets.push(cleaned);
      } else if (trimmed.length > 30 && /^[A-Z]/.test(trimmed)) {
        projBullets.push(trimmed);
      }
    }
  }

  if (isFresher) {
    const combined = [...expBullets, ...projBullets];
    return {
      bullets: combined,
      source: expBullets.length > 0 ? 'both' : 'projects',
    };
  }

  if (expBullets.length > 0) {
    return { bullets: expBullets, source: 'experience' };
  }

  // Fallback to project bullets if experience entries was empty
  return {
    bullets: projBullets,
    source: projBullets.length > 0 ? 'projects' : 'experience',
  };
}

/**
 * Rule: dates-present-consistent (5 pts)
 * Proportional: (entriesWithDates / totalEntries) * 5.
 *
 * For freshers: avoids the non-experience bottleneck by not penalizing
 * the absence of full-time corporate work history.
 */
export function checkDatesPresentConsistent(
  parsedResume: ParsedResume,
  profile?: ResumeTypeProfile,
  experienceLevel?: string,
): RuleResult {
  const maxPoints = 5;
  const isFresher =
    experienceLevel === 'fresher' || profile?.isFresherProfile === true;
  const entries = parsedResume.experienceEntries;

  // Fresher handling: no corporate employment required
  if (entries.length === 0) {
    if (isFresher) {
      return {
        id: 'dates-present-consistent',
        category: CATEGORY,
        passed: true,
        points: maxPoints,
        maxPoints,
        message:
          'Fresher evaluation active: Academic timeline and project credentials verified. Full-time corporate tenure is not required.',
        severity: 'pass',
      };
    }

    return {
      id: 'dates-present-consistent',
      category: CATEGORY,
      passed: false,
      points: 0,
      maxPoints,
      message:
        'No experience entries detected. Add employment history with dates for each role.',
      severity: 'warning',
    };
  }

  const entriesWithDates = entries.filter(
    (e) => e.startDate !== null || e.endDate !== null,
  ).length;

  const ratio = entriesWithDates / entries.length;
  const points = Math.round(ratio * maxPoints);

  let message: string;
  if (points === maxPoints) {
    message = 'All experience entries include dates.';
  } else if (entriesWithDates === 0) {
    message =
      'No employment dates found in any experience entry. ATS systems use dates to calculate tenure, progression, and employment gaps — add dates for each role (e.g. "Jan 2020 – Present").';
  } else {
    message = `${entriesWithDates} of ${entries.length} experience entries include dates. Add dates to all roles for complete ATS parsing.`;
  }

  return {
    id: 'dates-present-consistent',
    category: CATEGORY,
    passed: points === maxPoints,
    points,
    maxPoints,
    message,
    severity: points === maxPoints ? 'pass' : points >= 3 ? 'warning' : 'fail',
  };
}

/**
 * Rule: action-verbs-used (5 pts)
 * Proportional: (bulletsWithActionVerb / totalBullets) * 5.
 * Checks first word of each bullet against action verb bank.
 * Penalizes "Responsible for…" pattern specifically.
 */
export function checkActionVerbsUsed(
  parsedResume: ParsedResume,
  profile: ResumeTypeProfile,
  experienceLevel?: string,
): RuleResult {
  const maxPoints = 5;
  const isFresher =
    experienceLevel === 'fresher' || profile.isFresherProfile === true;
  const { bullets: allBullets, source } = extractEvaluationBullets(
    parsedResume,
    isFresher,
  );

  if (allBullets.length === 0) {
    const scopeLabel = isFresher
      ? 'projects or experience entries'
      : 'experience entries';
    return {
      id: 'action-verbs-used',
      category: CATEGORY,
      passed: false,
      points: 0,
      maxPoints,
      message: `No bullet points found in ${scopeLabel}. Use bullet points starting with strong action verbs (e.g. Built, Developed, Designed) to describe your accomplishments.`,
      severity: 'warning',
    };
  }

  const actionVerbSet = new Set(
    profile.actionVerbBank.map((v) => v.toLowerCase()),
  );

  let actionVerbBullets = 0;
  let responsibleForCount = 0;

  for (const bullet of allBullets) {
    const trimmed = bullet.trim();
    const firstWord = trimmed
      .split(/\s+/)[0]
      ?.toLowerCase()
      .replace(/[^a-z]/g, '');

    if (!firstWord) continue;

    if (actionVerbSet.has(firstWord)) {
      actionVerbBullets++;
    }

    // Check for "Responsible for" anti-pattern
    if (/^responsible\s+for\b/i.test(trimmed)) {
      responsibleForCount++;
    }
  }

  const ratio = actionVerbBullets / allBullets.length;
  let points = Math.round(ratio * maxPoints);

  // Penalize "Responsible for" usage — deduct 1 point per 2 occurrences, min 0
  const penalty = Math.floor(responsibleForCount / 2);
  points = Math.max(0, points - penalty);

  const scope = source === 'projects' ? 'project' : 'experience';
  let message: string;
  if (points === maxPoints) {
    message = `Strong use of action verbs: ${actionVerbBullets} of ${allBullets.length} ${scope} bullets start with action verbs.`;
  } else {
    const parts: string[] = [];
    parts.push(
      `${actionVerbBullets} of ${allBullets.length} ${scope} bullets start with strong action verbs.`,
    );
    if (responsibleForCount > 0) {
      parts.push(
        `Found ${responsibleForCount} "Responsible for…" bullets — rewrite these with action verbs (e.g. "Led" instead of "Responsible for leading").`,
      );
    }
    parts.push(
      `Start each bullet with a strong verb like: ${profile.actionVerbBank.slice(0, 5).join(', ')}.`,
    );
    message = parts.join(' ');
  }

  return {
    id: 'action-verbs-used',
    category: CATEGORY,
    passed: points === maxPoints,
    points,
    maxPoints,
    message,
    severity: points === maxPoints ? 'pass' : points >= 3 ? 'warning' : 'fail',
  };
}

/**
 * Rule: quantified-impact (10 pts)
 * Proportional: (bulletsWithMetrics / totalBullets) * 10.
 * Uses ResumeTypeProfile's impactMetricPatterns.
 */
export function checkQuantifiedImpact(
  parsedResume: ParsedResume,
  profile: ResumeTypeProfile,
  experienceLevel?: string,
): RuleResult {
  const maxPoints = 10;
  const isFresher =
    experienceLevel === 'fresher' || profile.isFresherProfile === true;
  const { bullets: allBullets, source } = extractEvaluationBullets(
    parsedResume,
    isFresher,
  );

  if (allBullets.length === 0) {
    const scopeLabel = isFresher
      ? 'projects or experience entries'
      : 'experience entries';
    return {
      id: 'quantified-impact',
      category: CATEGORY,
      passed: false,
      points: 0,
      maxPoints,
      message: `No bullet points found to assess quantified impact in ${scopeLabel}. Add measurable achievements (numbers, percentages, user metrics) to your accomplishments.`,
      severity: 'warning',
    };
  }

  let bulletsWithMetrics = 0;

  for (const bullet of allBullets) {
    const hasMetric = profile.impactMetricPatterns.some((pattern) =>
      pattern.test(bullet),
    );
    if (hasMetric) {
      bulletsWithMetrics++;
    }
  }

  const ratio = allBullets.length > 0 ? bulletsWithMetrics / allBullets.length : 0;
  const points = Math.round(ratio * maxPoints);

  const scope = source === 'projects' ? 'project' : 'experience';
  let message: string;
  if (points >= 8) {
    message = `Strong quantified impact: ${bulletsWithMetrics} of ${allBullets.length} ${scope} bullets include measurable results.`;
  } else if (bulletsWithMetrics > 0) {
    message = `${bulletsWithMetrics} of ${allBullets.length} ${scope} bullets include quantified impact. Add concrete numbers, metrics, or performance stats (e.g. "Used by 300+ students", "Reduced latency by 40%").`;
  } else {
    message = `No quantified achievements found. Resumes with measurable impact (%, numbers, scale, metrics) are significantly more competitive. Add concrete metrics to your ${scope} accomplishments.`;
  }

  return {
    id: 'quantified-impact',
    category: CATEGORY,
    passed: points === maxPoints,
    points,
    maxPoints,
    message,
    severity: points >= 8 ? 'pass' : points >= 4 ? 'warning' : 'fail',
  };
}

/**
 * Runs all Experience Quality rules (20 pts total).
 */
export function runExperienceRules(
  parsedResume: ParsedResume,
  profile: ResumeTypeProfile,
  experienceLevel?: string,
): RuleResult[] {
  return [
    checkDatesPresentConsistent(parsedResume, profile, experienceLevel),
    checkActionVerbsUsed(parsedResume, profile, experienceLevel),
    checkQuantifiedImpact(parsedResume, profile, experienceLevel),
  ];
}
