"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatesPresentConsistent = checkDatesPresentConsistent;
exports.checkActionVerbsUsed = checkActionVerbsUsed;
exports.checkQuantifiedImpact = checkQuantifiedImpact;
exports.runExperienceRules = runExperienceRules;
const CATEGORY = 'Experience Quality Signals';
function checkDatesPresentConsistent(parsedResume) {
    const maxPoints = 5;
    const entries = parsedResume.experienceEntries;
    if (entries.length === 0) {
        return {
            id: 'dates-present-consistent',
            category: CATEGORY,
            passed: false,
            points: 0,
            maxPoints,
            message: 'No experience entries detected. Add employment history with dates for each role.',
            severity: 'warning',
        };
    }
    const entriesWithDates = entries.filter((e) => e.startDate !== null || e.endDate !== null).length;
    const ratio = entriesWithDates / entries.length;
    const points = Math.round(ratio * maxPoints);
    let message;
    if (points === maxPoints) {
        message = 'All experience entries include dates.';
    }
    else if (entriesWithDates === 0) {
        message = 'No employment dates found in any experience entry. ATS systems use dates to calculate tenure, progression, and employment gaps — add dates for each role (e.g. "Jan 2020 – Present").';
    }
    else {
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
function checkActionVerbsUsed(parsedResume, profile) {
    const maxPoints = 5;
    const allBullets = parsedResume.experienceEntries.flatMap((e) => e.bullets);
    if (allBullets.length === 0) {
        return {
            id: 'action-verbs-used',
            category: CATEGORY,
            passed: false,
            points: 0,
            maxPoints,
            message: 'No bullet points found in experience entries. Use bullet points starting with strong action verbs to describe your accomplishments.',
            severity: 'warning',
        };
    }
    const actionVerbSet = new Set(profile.actionVerbBank.map((v) => v.toLowerCase()));
    let actionVerbBullets = 0;
    let responsibleForCount = 0;
    for (const bullet of allBullets) {
        const trimmed = bullet.trim();
        const firstWord = trimmed
            .split(/\s+/)[0]
            ?.toLowerCase()
            .replace(/[^a-z]/g, '');
        if (!firstWord)
            continue;
        if (actionVerbSet.has(firstWord)) {
            actionVerbBullets++;
        }
        if (/^responsible\s+for\b/i.test(trimmed)) {
            responsibleForCount++;
        }
    }
    const ratio = actionVerbBullets / allBullets.length;
    let points = Math.round(ratio * maxPoints);
    const penalty = Math.floor(responsibleForCount / 2);
    points = Math.max(0, points - penalty);
    let message;
    if (points === maxPoints) {
        message = `Strong use of action verbs: ${actionVerbBullets} of ${allBullets.length} bullets start with action verbs.`;
    }
    else {
        const parts = [];
        parts.push(`${actionVerbBullets} of ${allBullets.length} bullets start with strong action verbs.`);
        if (responsibleForCount > 0) {
            parts.push(`Found ${responsibleForCount} "Responsible for…" bullets — rewrite these with action verbs (e.g. "Led" instead of "Responsible for leading").`);
        }
        parts.push(`Start each bullet with a strong verb like: ${profile.actionVerbBank.slice(0, 5).join(', ')}.`);
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
function checkQuantifiedImpact(parsedResume, profile) {
    const maxPoints = 10;
    const allBullets = parsedResume.experienceEntries.flatMap((e) => e.bullets);
    if (allBullets.length === 0) {
        return {
            id: 'quantified-impact',
            category: CATEGORY,
            passed: false,
            points: 0,
            maxPoints,
            message: 'No bullet points found to assess quantified impact. Add measurable achievements (numbers, percentages, metrics) to your experience entries.',
            severity: 'warning',
        };
    }
    let bulletsWithMetrics = 0;
    for (const bullet of allBullets) {
        const hasMetric = profile.impactMetricPatterns.some((pattern) => pattern.test(bullet));
        if (hasMetric) {
            bulletsWithMetrics++;
        }
    }
    const ratio = allBullets.length > 0 ? bulletsWithMetrics / allBullets.length : 0;
    const points = Math.round(ratio * maxPoints);
    let message;
    if (points >= 8) {
        message = `Strong quantified impact: ${bulletsWithMetrics} of ${allBullets.length} bullets include measurable results.`;
    }
    else if (bulletsWithMetrics > 0) {
        message = `${bulletsWithMetrics} of ${allBullets.length} bullets include quantified impact. Add numbers, percentages, or metrics to more bullets — e.g. "Reduced response time by 40%" or "Managed a team of 8".`;
    }
    else {
        message = `No quantified achievements found. Resumes with measurable impact (%, $, team sizes, metrics) are significantly more effective. Add concrete numbers to your accomplishments.`;
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
function runExperienceRules(parsedResume, profile) {
    return [
        checkDatesPresentConsistent(parsedResume),
        checkActionVerbsUsed(parsedResume, profile),
        checkQuantifiedImpact(parsedResume, profile),
    ];
}
//# sourceMappingURL=experience.rules.js.map