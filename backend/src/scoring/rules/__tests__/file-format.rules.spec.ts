import { ExtractionResult } from '../../../file-ingest/interfaces/extraction-result.interface';
import {
  checkFileIsValidDocument,
  checkTextLayerExtractable,
  checkNoEncodingIssues,
  runFileFormatRules,
} from '../file-format.rules';

describe('File Format Rules (15 pts)', () => {
  const makeExtraction = (overrides: Partial<ExtractionResult> = {}): ExtractionResult => ({
    text: 'Some resume content here with enough text to be valid.',
    pageCount: 1,
    wordCount: 50,
    isImageOnly: false,
    hasEncodingIssues: false,
    metadata: {},
    ...overrides,
  });

  describe('checkFileIsValidDocument (5 pts)', () => {
    it('should award 5 pts for a valid document with content', () => {
      const result = checkFileIsValidDocument(makeExtraction());
      expect(result.id).toBe('file-is-valid-document');
      expect(result.points).toBe(5);
      expect(result.maxPoints).toBe(5);
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('pass');
    });

    it('should award 5 pts for an image-only PDF (file itself is valid, just no text)', () => {
      const result = checkFileIsValidDocument(makeExtraction({ isImageOnly: true, text: '' }));
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts for empty extraction with no text and not image-only', () => {
      const result = checkFileIsValidDocument(makeExtraction({ text: '', isImageOnly: false }));
      expect(result.points).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('fail');
    });
  });

  describe('checkTextLayerExtractable (5 pts)', () => {
    it('should award 5 pts when text layer is present', () => {
      const result = checkTextLayerExtractable(makeExtraction());
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts for scanned/image-only PDF', () => {
      const result = checkTextLayerExtractable(makeExtraction({ isImageOnly: true }));
      expect(result.points).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('fail');
      expect(result.message).toContain('scanned image');
    });
  });

  describe('checkNoEncodingIssues (5 pts)', () => {
    it('should award 5 pts when no encoding issues', () => {
      const result = checkNoEncodingIssues(makeExtraction());
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts when encoding issues detected', () => {
      const result = checkNoEncodingIssues(makeExtraction({ hasEncodingIssues: true }));
      expect(result.points).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Encoding issues');
    });
  });

  describe('runFileFormatRules (all 3 rules)', () => {
    it('should return 3 rule results totaling 15 pts for clean extraction', () => {
      const results = runFileFormatRules(makeExtraction());
      expect(results).toHaveLength(3);
      const total = results.reduce((sum, r) => sum + r.points, 0);
      expect(total).toBe(15);
    });

    it('should return 5 pts total for image-only PDF (only file-valid passes)', () => {
      const results = runFileFormatRules(makeExtraction({ isImageOnly: true, text: '' }));
      expect(results).toHaveLength(3);
      const total = results.reduce((sum, r) => sum + r.points, 0);
      expect(total).toBe(10); // file-valid=5, text-layer=0, encoding=5 (empty text has no encoding issues)
    });
  });
});
