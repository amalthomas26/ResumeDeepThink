import {
  checkSkillsSectionParseable,
  checkKeywordCoverage,
  checkNoKeywordStuffing,
  runKeywordRules,
} from '../keywords.rules';
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

const makeSkillsSection = (content: string): ResumeSection => ({
  type: 'skills',
  headerText: 'Skills',
  content,
  startLine: 0,
  endLine: 5,
  confidence: 1.0,
});

describe('Keyword & Skills Rules (25 pts)', () => {
  describe('checkSkillsSectionParseable (5 pts)', () => {
    it('should award 5 pts for well-formatted skills list', () => {
      const resume = makeResume({
        sections: [makeSkillsSection('JavaScript, React, Node.js, Python')],
        skillsList: ['JavaScript', 'React', 'Node.js', 'Python'],
      });
      const result = checkSkillsSectionParseable(resume);
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts when no skills section exists', () => {
      const resume = makeResume({ sections: [], skillsList: [] });
      const result = checkSkillsSectionParseable(resume);
      expect(result.points).toBe(0);
      expect(result.message).toContain('No Skills section');
    });

    it('should award 2 pts (partial) for prose-formatted skills', () => {
      const resume = makeResume({
        sections: [makeSkillsSection('I have extensive experience in developing applications using various modern technologies and frameworks for building web solutions')],
        skillsList: [
          'I have extensive experience in developing applications using various modern technologies and frameworks for building web solutions',
        ],
      });
      const result = checkSkillsSectionParseable(resume);
      expect(result.points).toBe(2);
      expect(result.message).toContain('prose');
    });

    it('should award 0 pts when skills section exists but no items parsed', () => {
      const resume = makeResume({
        sections: [makeSkillsSection('...')],
        skillsList: [],
      });
      const result = checkSkillsSectionParseable(resume);
      expect(result.points).toBe(0);
    });
  });

  describe('checkKeywordCoverage (15 pts)', () => {
    it('should award full 15 pts for strong keyword coverage', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const resume = makeResume({ fullText: text });
      const result = checkKeywordCoverage(resume, techProfile);
      expect(result.points).toBe(15);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts for zero keyword matches', () => {
      const resume = makeResume({
        fullText: 'This resume has absolutely no technical content or relevant keywords whatsoever.',
      });
      const result = checkKeywordCoverage(resume, techProfile);
      expect(result.points).toBe(0);
    });

    it('should award proportional points for partial coverage', () => {
      const resume = makeResume({
        fullText: 'I have experience with python and sql databases.',
      });
      const result = checkKeywordCoverage(resume, techProfile);
      expect(result.points).toBeGreaterThan(0);
      expect(result.points).toBeLessThan(15);
    });

    it('should weight soft skills at 0.5x', () => {
      // Only soft skills, no hard skills
      const resume = makeResume({
        fullText: 'leadership collaboration teamwork communication problem solving critical thinking',
      });
      const result = checkKeywordCoverage(resume, techProfile);
      // 6 soft skills * 0.5 = 3.0 effective matches out of target 8
      expect(result.points).toBeLessThan(10);
    });
  });

  describe('checkNoKeywordStuffing (5 pts)', () => {
    it('should award 5 pts for normal keyword usage', () => {
      const resume = makeResume({
        fullText: 'Developed web applications using React and Node.js. Built REST APIs with Express. Deployed services with Docker on AWS.',
        skillsList: ['React', 'Node.js', 'Express', 'Docker', 'AWS', 'JavaScript', 'TypeScript', 'PostgreSQL', 'Redis', 'Git'],
      });
      const result = checkNoKeywordStuffing(resume, techProfile);
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should detect keyword stuffing from repeated keywords', () => {
      const text = loadFixture(FIXTURES.KEYWORD_STUFFED);
      const resume = makeResume({
        fullText: text,
        skillsList: text.split('\n').slice(3, 5).join(',').split(',').map(s => s.trim()).filter(Boolean),
      });
      const result = checkNoKeywordStuffing(resume, techProfile);
      expect(result.points).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Keyword stuffing');
    });

    it('should detect oversized skills list (50+ items)', () => {
      const resume = makeResume({
        fullText: 'normal content',
        skillsList: Array(55).fill('').map((_, i) => `Skill ${i}`),
      });
      const result = checkNoKeywordStuffing(resume, techProfile);
      expect(result.points).toBe(0);
      expect(result.message).toContain('unusually large');
    });
  });

  describe('runKeywordRules (all 3 rules)', () => {
    it('should return 3 results for any input', () => {
      const resume = makeResume();
      const results = runKeywordRules(resume, techProfile);
      expect(results).toHaveLength(3);
    });
  });
});
