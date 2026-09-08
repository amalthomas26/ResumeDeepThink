"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFileIsValidDocument = checkFileIsValidDocument;
exports.checkTextLayerExtractable = checkTextLayerExtractable;
exports.checkNoEncodingIssues = checkNoEncodingIssues;
exports.runFileFormatRules = runFileFormatRules;
const CATEGORY = 'File & Format Integrity';
function checkFileIsValidDocument(extractionResult) {
    const maxPoints = 5;
    const hasContent = extractionResult.text.length > 0 || extractionResult.isImageOnly;
    const points = hasContent ? maxPoints : 0;
    return {
        id: 'file-is-valid-document',
        category: CATEGORY,
        passed: points === maxPoints,
        points,
        maxPoints,
        message: hasContent
            ? 'File is a valid, parseable document.'
            : 'The file could not be parsed as a valid document.',
        severity: hasContent ? 'pass' : 'fail',
    };
}
function checkTextLayerExtractable(extractionResult) {
    const maxPoints = 5;
    const points = extractionResult.isImageOnly ? 0 : maxPoints;
    return {
        id: 'text-layer-extractable',
        category: CATEGORY,
        passed: !extractionResult.isImageOnly,
        points,
        maxPoints,
        message: extractionResult.isImageOnly
            ? 'No extractable text found — this appears to be a scanned image. ATS systems cannot read image-only PDFs. Try exporting your resume as a text-based PDF (Word → Save as PDF).'
            : 'Text layer is present and extractable.',
        severity: extractionResult.isImageOnly ? 'fail' : 'pass',
    };
}
function checkNoEncodingIssues(extractionResult) {
    const maxPoints = 5;
    const points = extractionResult.hasEncodingIssues ? 0 : maxPoints;
    return {
        id: 'no-encoding-issues',
        category: CATEGORY,
        passed: !extractionResult.hasEncodingIssues,
        points,
        maxPoints,
        message: extractionResult.hasEncodingIssues
            ? 'Encoding issues detected — some characters appear garbled or corrupted. This typically results from a bad PDF export. Re-export your resume from the original source (e.g. Word or Google Docs).'
            : 'No character encoding issues detected.',
        severity: extractionResult.hasEncodingIssues ? 'fail' : 'pass',
    };
}
function runFileFormatRules(extractionResult) {
    return [
        checkFileIsValidDocument(extractionResult),
        checkTextLayerExtractable(extractionResult),
        checkNoEncodingIssues(extractionResult),
    ];
}
//# sourceMappingURL=file-format.rules.js.map