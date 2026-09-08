import {
  checkStandardSectionsDetected,
  checkNoMultiColumnLayout,
  checkNoTablesOrTextboxes,
  runStructureRules,
} from '../structure.rules';
import { ParsedResume, ResumeSection } from '../../interfaces/parsed-resume.interface';
import { techProfile } from '../../profiles/tech.profile';
import { loadFixture, FIXTURES } from '../../test-utils/fixture-loader';

const makeResume = (overrides: Partial<ParsedResume> = {}): ParsedResume => ({
  fullText: '',
  sections: [],
  contactInfo: { name: null, email: null, phone: null, linkedinUrl: null, portfolioUrl: null },
  experienceEntries: [],
  skillsList: [],
  wordCount: 300,
  pageCount: 1,
  ...overrides,
});

const makeSection = (type: string, confidence = 1.0): ResumeSection => ({
  type: type as any,
  headerText: type.charAt(0).toUpperCase() + type.slice(1),
  content: 'Some content here with enough words to not be considered empty or near-empty section.',
  startLine: 0,
  endLine: 10,
  confidence,
});

describe('Structure Rules (20 pts)', () => {
  describe('checkStandardSectionsDetected (10 pts)', () => {
    it('should award 10 pts when all expected sections found', () => {
      const resume = makeResume({
        sections: [
          makeSection('summary'),
          makeSection('experience'),
          makeSection('education'),
          makeSection('skills'),
        ],
      });
      const result = checkStandardSectionsDetected(resume, techProfile);
      expect(result.points).toBe(10);
      expect(result.passed).toBe(true);
    });

    it('should award proportional points for partial sections', () => {
      const resume = makeResume({
        sections: [makeSection('experience'), makeSection('skills')],
      });
      const result = checkStandardSectionsDetected(resume, techProfile);
      // 2/4 sections = 5 pts
      expect(result.points).toBe(5);
    });

    it('should award 0 pts when no sections found', () => {
      const resume = makeResume({ sections: [] });
      const result = checkStandardSectionsDetected(resume, techProfile);
      expect(result.points).toBe(0);
      expect(result.message).toContain('Could not identify');
    });

    it('should not count low-confidence section matches', () => {
      const resume = makeResume({
        sections: [
          makeSection('experience', 0.3), // Below 0.5 threshold
          makeSection('skills', 1.0),
        ],
      });
      const result = checkStandardSectionsDetected(resume, techProfile);
      // Only skills (1/4) = 3 pts (rounded)
      expect(result.points).toBe(3);
    });
  });

  describe('checkNoMultiColumnLayout (5 pts)', () => {
    it('should award 5 pts for single-column resume', () => {
      const cleanText = loadFixture(FIXTURES.CLEAN);
      const resume = makeResume({ fullText: cleanText });
      const result = checkNoMultiColumnLayout(resume);
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should detect multi-column layout', () => {
      const twoColText = loadFixture(FIXTURES.TWO_COLUMN);
      const resume = makeResume({ fullText: twoColText });
      const result = checkNoMultiColumnLayout(resume);
      expect(result.points).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('multi-column');
    });

    it('should pass for very short content (too few lines to detect)', () => {
      const resume = makeResume({ fullText: 'Line 1\nLine 2\nLine 3' });
      const result = checkNoMultiColumnLayout(resume);
      expect(result.points).toBe(5);
    });
  });

  describe('checkNoTablesOrTextboxes (5 pts)', () => {
    it('should award 5 pts for resume without tables', () => {
      const cleanText = loadFixture(FIXTURES.CLEAN);
      const resume = makeResume({ fullText: cleanText });
      const result = checkNoTablesOrTextboxes(resume);
      expect(result.points).toBe(5);
    });

    it('should detect pipe-delimited tables', () => {
      const tableText = [
        '| Skill | Level |',
        '|-------|-------|',
        '| Python | Expert |',
        '| Java | Advanced |',
        '| SQL | Expert |',
      ].join('\n');
      const resume = makeResume({ fullText: tableText });
      const result = checkNoTablesOrTextboxes(resume);
      expect(result.points).toBe(0);
      expect(result.message).toContain('Table');
    });
  });

  describe('runStructureRules (all 3 rules)', () => {
    it('should return 3 results totaling 20 pts for well-structured resume', () => {
      const cleanText = loadFixture(FIXTURES.CLEAN);
      const resume = makeResume({
        fullText: cleanText,
        sections: [
          makeSection('summary'),
          makeSection('experience'),
          makeSection('education'),
          makeSection('skills'),
        ],
      });
      const results = runStructureRules(resume, techProfile);
      expect(results).toHaveLength(3);
      const total = results.reduce((sum, r) => sum + r.points, 0);
      expect(total).toBe(20);
    });
  });
});
