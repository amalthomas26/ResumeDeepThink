import { ScoringService } from '../services/scoring.service';
import { ResumeParserService } from '../services/resume-parser.service';
import { ExtractionResult } from '../../file-ingest/interfaces/extraction-result.interface';
import { loadFixture, FIXTURES } from '../test-utils/fixture-loader';

describe('ScoringService', () => {
  let scoringService: ScoringService;

  beforeEach(() => {
    const parser = new ResumeParserService();
    scoringService = new ScoringService(parser);
  });

  const makeExtraction = (
    text: string,
    overrides: Partial<ExtractionResult> = {},
  ): ExtractionResult => ({
    text,
    pageCount: 1,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    isImageOnly: false,
    hasEncodingIssues: false,
    metadata: {},
    ...overrides,
  });

  describe('score() with clean resume', () => {
    it('should produce a high score (65+)', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = scoringService.score(makeExtraction(text), 'tech');

      expect(result.overallScore).toBeGreaterThanOrEqual(65);
      expect(result.maxScore).toBe(100);
      expect(result.band).toMatch(/strong|workable/);
      expect(result.checkId).toBeTruthy();
      expect(result.resumeType).toBe('tech');
    });

    it('should return all 6 categories', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = scoringService.score(makeExtraction(text), 'tech');

      expect(result.categories.length).toBe(6);
      const categoryNames = result.categories.map((c) => c.name);
      expect(categoryNames).toContain('File & Format Integrity');
      expect(categoryNames).toContain('Contact & Identity Parsing');
      expect(categoryNames).toContain('Structural Parsing');
      expect(categoryNames).toContain('Keyword & Skills Alignment');
      expect(categoryNames).toContain('Experience Quality Signals');
      expect(categoryNames).toContain('Length & Density');
    });

    it('should return all 15 rule results', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = scoringService.score(makeExtraction(text), 'tech');

      // 3 + 4 + 3 + 3 + 3 + 2 = 18 rules
      expect(result.ruleResults.length).toBe(18);
    });

    it('should include processing metadata', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = scoringService.score(makeExtraction(text));

      expect(result.meta.wordCount).toBeGreaterThan(0);
      expect(result.meta.pageCount).toBe(1);
      expect(result.meta.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('score() with image-only PDF (short-circuit)', () => {
    it('should return a distinct result, not score an empty resume', () => {
      const result = scoringService.score(
        makeExtraction('', { isImageOnly: true, pageCount: 2 }),
      );

      expect(result.overallScore).toBe(0);
      expect(result.bandLabel).toContain('scanned');
      expect(result.categories.length).toBe(1); // Only file format
      expect(result.meta.pageCount).toBe(2);
    });
  });

  describe('score() with empty resume', () => {
    it('should produce a very low score', () => {
      const text = loadFixture(FIXTURES.EMPTY);
      const result = scoringService.score(makeExtraction(text));

      expect(result.overallScore).toBeLessThan(40);
      expect(result.band).toBe('high-risk');
    });
  });

  describe('score() with keyword-stuffed resume', () => {
    it('should penalize keyword stuffing', () => {
      const text = loadFixture(FIXTURES.KEYWORD_STUFFED);
      const result = scoringService.score(makeExtraction(text), 'tech');

      // Should detect stuffing in the keywords category
      const keywordCategory = result.categories.find(
        (c) => c.name === 'Keyword & Skills Alignment',
      );
      expect(keywordCategory).toBeDefined();

      const stuffingRule = keywordCategory!.rules.find(
        (r) => r.id === 'no-keyword-stuffing',
      );
      expect(stuffingRule).toBeDefined();
      expect(stuffingRule!.points).toBe(0);
    });
  });

  describe('score() with auto-detect resume type', () => {
    it('should auto-detect tech resume when no type specified', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = scoringService.score(makeExtraction(text));

      expect(result.resumeType).toBe('tech');
    });

    it('should use the explicit type when provided', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = scoringService.score(makeExtraction(text), 'finance');

      expect(result.resumeType).toBe('finance');
    });
  });

  describe('edge case diagnostics (language and anomaly detection)', () => {
    it('should flag non-English resume and provide diagnostic warning', () => {
      const hindiText = `
        राजेश शर्मा
        सॉफ्टवेयर इंजीनियर
        rajesh@example.com | नई दिल्ली
        
        व्यावसायिक सारांश:
        क्लाउड सेवाओं और आधुनिक वेब अनुप्रयोगों के विकास में ६ वर्षों का अनुभव।
        
        अनुभव:
        वरिष्ठ डेवलपर - इंफोटेक सॉल्यूशंस (२०२० - वर्तमान)
        - डेटाबेस प्रबंधन और माइक्रोसर्विसेज आर्किटेक्चर का निर्माण किया।
        - सिस्टम थ्रूपुट में ४०% सुधार हासिल किया।
        
        शिक्षा:
        बी.टेक कंप्यूटर साइंस
      `;

      const result = scoringService.score(makeExtraction(hindiText));
      expect(result.isNonEnglish).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('calibrated for English-language resumes'))).toBe(true);
    });

    it('should flag multi-resume pasted anomaly and provide guidance warning', () => {
      const duplicateContent = 'Developed enterprise microservices and deployed Kubernetes clusters across regions. '.repeat(100);
      const multiResumeText = `
        First Candidate
        candidate1@example.com
        Experience
        ${duplicateContent}
        
        Second Candidate
        candidate2@example.com
        Experience
        ${duplicateContent}
      `;

      const extraction = makeExtraction(multiResumeText, { pageCount: 4 });
      const result = scoringService.score(extraction);
      expect(result.isMultiResumeAnomaly).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('multi-resume merge'))).toBe(true);
    });

    it('should include warning for image-only PDF', () => {
      const result = scoringService.score(
        makeExtraction('', { isImageOnly: true, pageCount: 2 }),
      );
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('scanned image');
    });
  });
});
