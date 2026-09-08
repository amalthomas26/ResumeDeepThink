"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStandardSectionsDetected = checkStandardSectionsDetected;
exports.checkNoMultiColumnLayout = checkNoMultiColumnLayout;
exports.checkNoTablesOrTextboxes = checkNoTablesOrTextboxes;
exports.runStructureRules = runStructureRules;
const CATEGORY = 'Structural Parsing';
function checkStandardSectionsDetected(parsedResume, profile, experienceLevel) {
    const maxPoints = 10;
    const isFresher = experienceLevel === 'fresher' || profile.isFresherProfile === true;
    let expectedSections = [...profile.expectedSections];
    const foundSectionTypes = new Set(parsedResume.sections
        .filter((s) => s.confidence >= 0.5)
        .map((s) => s.type));
    if (isFresher && expectedSections.includes('experience') && !foundSectionTypes.has('experience')) {
        expectedSections = expectedSections.map((s) => (s === 'experience' ? 'projects' : s));
    }
    const matchedCount = expectedSections.filter((expected) => foundSectionTypes.has(expected)).length;
    const ratio = expectedSections.length > 0
        ? matchedCount / expectedSections.length
        : 1;
    const points = Math.round(ratio * maxPoints);
    const missingSections = expectedSections.filter((s) => !foundSectionTypes.has(s));
    let message;
    if (points === maxPoints) {
        message = `All expected sections found: ${expectedSections.join(', ')}.`;
    }
    else if (matchedCount > 0) {
        message = `Found ${matchedCount} of ${expectedSections.length} expected sections. Missing: ${missingSections.join(', ')}. ATS systems look for standard section headers to categorize your content.`;
    }
    else {
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
function checkNoMultiColumnLayout(parsedResume) {
    const maxPoints = 5;
    const lines = parsedResume.fullText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 5) {
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
    const shortLineCount = lines.filter((l) => l.trim().length > 0 && l.trim().length < 40).length;
    const shortLineRatio = shortLineCount / totalLines;
    if (shortLineRatio > 0.6) {
        columnSignals += 2;
    }
    const midGapPattern = /\S\s{3,}\S/;
    const midGapCount = lines.filter((l) => midGapPattern.test(l)).length;
    const midGapRatio = midGapCount / totalLines;
    if (midGapRatio > 0.15) {
        columnSignals += 2;
    }
    const lineLengths = lines.map((l) => l.trim().length);
    const avgLength = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
    const variance = lineLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
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
function checkNoTablesOrTextboxes(parsedResume) {
    const maxPoints = 5;
    const lines = parsedResume.fullText.split('\n');
    let tableSignals = 0;
    const pipeLineCount = lines.filter((l) => {
        const pipeCount = (l.match(/\|/g) || []).length;
        return pipeCount >= 2;
    }).length;
    if (pipeLineCount >= 3) {
        tableSignals += 2;
    }
    const tabLineCount = lines.filter((l) => {
        const tabCount = (l.match(/\t/g) || []).length;
        return tabCount >= 2;
    }).length;
    if (tabLineCount >= 3) {
        tableSignals += 2;
    }
    const borderLineCount = lines.filter((l) => /^[\s\-_=+|]{5,}$/.test(l.trim())).length;
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
function runStructureRules(parsedResume, profile, experienceLevel) {
    return [
        checkStandardSectionsDetected(parsedResume, profile, experienceLevel),
        checkNoMultiColumnLayout(parsedResume),
        checkNoTablesOrTextboxes(parsedResume),
    ];
}
//# sourceMappingURL=structure.rules.js.map