"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWordCountInRange = checkWordCountInRange;
exports.checkNoBlankSections = checkNoBlankSections;
exports.runLengthDensityRules = runLengthDensityRules;
const CATEGORY = 'Length & Density';
function inferExperienceYears(parsedResume) {
    const currentYear = new Date().getFullYear();
    let earliestYear = null;
    for (const entry of parsedResume.experienceEntries) {
        const dateStr = entry.startDate || entry.endDate;
        if (!dateStr)
            continue;
        const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0], 10);
            if (earliestYear === null || year < earliestYear) {
                earliestYear = year;
            }
        }
    }
    if (earliestYear === null)
        return null;
    return currentYear - earliestYear;
}
function getWordCountRange(experienceYears) {
    if (experienceYears === null) {
        return { min: 150, max: 1400, level: 'unknown' };
    }
    if (experienceYears <= 2) {
        return { min: 150, max: 600, level: 'entry-level' };
    }
    if (experienceYears <= 7) {
        return { min: 350, max: 1000, level: 'mid-level' };
    }
    return { min: 500, max: 1400, level: 'senior' };
}
function checkWordCountInRange(parsedResume) {
    const maxPoints = 5;
    const wordCount = parsedResume.wordCount;
    const experienceYears = inferExperienceYears(parsedResume);
    const { min, max, level } = getWordCountRange(experienceYears);
    let points;
    let message;
    let severity;
    if (wordCount >= min && wordCount <= max) {
        points = maxPoints;
        message = `Resume length (${wordCount} words) is appropriate${level !== 'unknown' ? ` for ${level} experience` : ''}.`;
        severity = 'pass';
    }
    else if (wordCount < min) {
        const ratio = wordCount / min;
        points = Math.round(Math.max(0, ratio * maxPoints));
        if (wordCount < 50) {
            message = 'Resume appears nearly empty. Add your experience, skills, and education to create a complete resume.';
            severity = 'fail';
        }
        else {
            message = `Resume is short (${wordCount} words)${level !== 'unknown' ? ` for ${level} experience (expected ${min}-${max} words)` : ''}. Consider adding more detail about your experience and accomplishments.`;
            severity = 'warning';
        }
    }
    else {
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
function checkNoBlankSections(parsedResume) {
    const maxPoints = 5;
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
    const emptySections = [];
    for (const section of parsedResume.sections) {
        const sectionWords = section.content.trim().split(/\s+/).filter(Boolean);
        if (sectionWords.length < 10 && section.type !== 'unknown') {
            emptySections.push(section.headerText || section.type);
        }
    }
    const lines = parsedResume.fullText.split('\n');
    let maxConsecutiveEmpty = 0;
    let currentEmpty = 0;
    for (const line of lines) {
        if (line.trim().length === 0) {
            currentEmpty++;
            maxConsecutiveEmpty = Math.max(maxConsecutiveEmpty, currentEmpty);
        }
        else {
            currentEmpty = 0;
        }
    }
    const hasBlankGaps = maxConsecutiveEmpty >= 5;
    const hasEmptySections = emptySections.length > 0;
    let points;
    let message;
    let severity;
    if (!hasBlankGaps && !hasEmptySections) {
        points = maxPoints;
        message = 'No blank sections or large gaps detected.';
        severity = 'pass';
    }
    else {
        const issues = [];
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
function runLengthDensityRules(parsedResume) {
    return [
        checkWordCountInRange(parsedResume),
        checkNoBlankSections(parsedResume),
    ];
}
//# sourceMappingURL=length-density.rules.js.map