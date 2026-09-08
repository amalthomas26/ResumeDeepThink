import { RuleResult } from '../interfaces/rule-result.interface';
import { ExtractionResult } from '../../file-ingest/interfaces/extraction-result.interface';

const CATEGORY = 'File & Format Integrity';

/**
 * Rule: file-is-valid-document (5 pts)
 * Checks that the uploaded file is a genuine PDF/DOCX with parseable content.
 * This consumes the validation result from FileIngestModule — if the file
 * reached this point, magic-byte validation already passed.
 */
export function checkFileIsValidDocument(
  extractionResult: ExtractionResult,
): RuleResult {
  const maxPoints = 5;

  // If extraction succeeded and the file was parseable at all,
  // this rule passes. The FileValidator already rejected non-documents.
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

/**
 * Rule: text-layer-extractable (5 pts)
 * Detects scanned/image-only PDFs with no text layer.
 * Per edge-cases.md: "do not silently score an empty resume as if
 * it were bad content."
 */
export function checkTextLayerExtractable(
  extractionResult: ExtractionResult,
): RuleResult {
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

/**
 * Rule: no-encoding-issues (5 pts)
 * Detects garbled characters from bad PDF export.
 */
export function checkNoEncodingIssues(
  extractionResult: ExtractionResult,
): RuleResult {
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

/**
 * Runs all File & Format Integrity rules (15 pts total).
 */
export function runFileFormatRules(
  extractionResult: ExtractionResult,
): RuleResult[] {
  return [
    checkFileIsValidDocument(extractionResult),
    checkTextLayerExtractable(extractionResult),
    checkNoEncodingIssues(extractionResult),
  ];
}
