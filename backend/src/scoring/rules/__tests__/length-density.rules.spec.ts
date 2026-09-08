import {
  checkWordCountInRange,
  checkNoBlankSections,
  runLengthDensityRules,
} from '../length-density.rules';
import { ParsedResume, ExperienceEntry, ResumeSection } from '../../interfaces/parsed-resume.interface';

const makeResume = (overrides: Partial<ParsedResume> = {}): ParsedResume => ({
  fullText: 'x '.repeat(300), // 300 words by default
  sections: [],
  contactInfo: { name: null, email: null, phone: null, linkedinUrl: null, portfolioUrl: null },
  experienceEntries: [],
  skillsList: [],
  wordCount: 300,
  pageCount: 1,
  ...overrides,
});

const seniorEntry: ExperienceEntry = {
  title: 'Senior Engineer',
  company: 'Corp',
  startDate: '2014',
  endDate: 'Present',
  bullets: [],
};

const fresherEntry: ExperienceEntry = {
  title: 'Intern',
  company: 'Corp',
  startDate: '2024',
  endDate: 'Present',
  bullets: [],
};

describe('Length & Density Rules (10 pts)', () => {
  describe('checkWordCountInRange (5 pts)', () => {
    it('should award 5 pts for appropriate word count', () => {
      const result = checkWordCountInRange(makeResume({ wordCount: 400 }));
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should penalize very short resume (near-empty)', () => {
      const result = checkWordCountInRange(makeResume({ wordCount: 20 }));
      expect(result.points).toBeLessThan(3);
      expect(result.message).toContain('empty');
    });

    it('should flag a long resume for entry-level experience', () => {
      const result = checkWordCountInRange(
        makeResume({
          wordCount: 1200,
          experienceEntries: [fresherEntry],
        }),
      );
      expect(result.points).toBeLessThan(5);
      expect(result.message).toContain('long');
    });

    it('should accept longer word count for senior experience', () => {
      const result = checkWordCountInRange(
        makeResume({
          wordCount: 1000,
          experienceEntries: [seniorEntry],
        }),
      );
      expect(result.points).toBe(5);
    });

    it('should accept concise word count (250-500 words) for fresher experienceLevel', () => {
      const result = checkWordCountInRange(
        makeResume({
          wordCount: 250,
          experienceEntries: [seniorEntry], // even if dates imply older
        }),
        'fresher',
      );
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
      expect(result.message).toContain('fresher / entry-level');
    });
  });

  describe('checkNoBlankSections (5 pts)', () => {
    it('should award 5 pts for resume with no blank sections', () => {
      const result = checkNoBlankSections(makeResume());
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts for near-empty resume', () => {
      const result = checkNoBlankSections(makeResume({ wordCount: 10, fullText: 'hello world' }));
      expect(result.points).toBe(0);
      expect(result.severity).toBe('fail');
    });

    it('should detect near-empty sections', () => {
      const section: ResumeSection = {
        type: 'skills',
        headerText: 'Skills',
        content: 'skill1',
        startLine: 0,
        endLine: 2,
        confidence: 1.0,
      };
      const result = checkNoBlankSections(makeResume({ sections: [section] }));
      expect(result.points).toBeLessThan(5);
      expect(result.message).toContain('Near-empty sections');
    });

    it('should detect large blank gaps', () => {
      const fullText = 'Content here\n\n\n\n\n\n\n\n\nMore content' + '\nword '.repeat(30);
      const result = checkNoBlankSections(makeResume({ fullText, wordCount: 50 }));
      expect(result.points).toBeLessThan(5);
    });
  });

  describe('runLengthDensityRules (all 2 rules)', () => {
    it('should return 2 results totaling 10 pts for good resume', () => {
      const results = runLengthDensityRules(makeResume());
      expect(results).toHaveLength(2);
      const total = results.reduce((sum, r) => sum + r.points, 0);
      expect(total).toBe(10);
    });
  });
});
