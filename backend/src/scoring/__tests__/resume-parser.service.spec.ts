import { ResumeParserService } from '../services/resume-parser.service';
import { loadFixture, FIXTURES } from '../test-utils/fixture-loader';

describe('ResumeParserService', () => {
  let parser: ResumeParserService;

  beforeEach(() => {
    parser = new ResumeParserService();
  });

  describe('parse() with clean resume', () => {
    it('should extract contact info correctly', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = parser.parse(text, 1);

      expect(result.contactInfo.name).toBe('John Smith');
      expect(result.contactInfo.email).toBe('john.smith@email.com');
      expect(result.contactInfo.phone).toBeTruthy();
      expect(result.contactInfo.linkedinUrl).toContain('linkedin.com/in/johnsmith');
    });

    it('should detect standard sections', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = parser.parse(text, 1);

      const sectionTypes = result.sections.map((s) => s.type);
      expect(sectionTypes).toContain('summary');
      expect(sectionTypes).toContain('experience');
      expect(sectionTypes).toContain('education');
      expect(sectionTypes).toContain('skills');
    });

    it('should parse experience entries with dates', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = parser.parse(text, 1);

      expect(result.experienceEntries.length).toBeGreaterThanOrEqual(2);

      // First entry should have dates
      const first = result.experienceEntries[0];
      expect(first.startDate).toBeTruthy();
      expect(first.bullets.length).toBeGreaterThan(0);
    });

    it('should parse skills list into discrete items', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = parser.parse(text, 1);

      expect(result.skillsList.length).toBeGreaterThan(5);
      // Skills should be short items, not paragraphs
      for (const skill of result.skillsList) {
        expect(skill.split(/\s+/).length).toBeLessThanOrEqual(5);
      }
    });

    it('should count words correctly', () => {
      const text = loadFixture(FIXTURES.CLEAN);
      const result = parser.parse(text, 1);

      expect(result.wordCount).toBeGreaterThan(100);
    });
  });

  describe('parse() with empty resume', () => {
    it('should handle near-empty text gracefully', () => {
      const text = loadFixture(FIXTURES.EMPTY);
      const result = parser.parse(text, 1);

      expect(result.sections).toHaveLength(0);
      expect(result.experienceEntries).toHaveLength(0);
      expect(result.skillsList).toHaveLength(0);
      expect(result.wordCount).toBeLessThan(10);
    });
  });

  describe('parse() with keyword-stuffed resume', () => {
    it('should still parse sections and entries', () => {
      const text = loadFixture(FIXTURES.KEYWORD_STUFFED);
      const result = parser.parse(text, 1);

      // Should still detect sections even in a stuffed resume
      const sectionTypes = result.sections.map((s) => s.type);
      expect(sectionTypes).toContain('skills');
      expect(sectionTypes).toContain('experience');

      // Should still find experience entries
      expect(result.experienceEntries.length).toBeGreaterThan(0);
    });
  });

  describe('section header fuzzy matching', () => {
    it('should match "Professional Experience" to experience', () => {
      const text = 'John Doe\n\nProfessional Experience\nSome content here';
      const result = parser.parse(text, 1);
      const sectionTypes = result.sections.map((s) => s.type);
      expect(sectionTypes).toContain('experience');
    });

    it('should match "Work History" to experience', () => {
      const text = 'Jane Doe\n\nWork History\nSome content here';
      const result = parser.parse(text, 1);
      const sectionTypes = result.sections.map((s) => s.type);
      expect(sectionTypes).toContain('experience');
    });

    it('should match "Core Competencies" to skills', () => {
      const text = 'Jane Doe\n\nCore Competencies\nPython, JavaScript';
      const result = parser.parse(text, 1);
      const sectionTypes = result.sections.map((s) => s.type);
      expect(sectionTypes).toContain('skills');
    });

    it('should match "Academic Background" to education', () => {
      const text = 'Jane Doe\n\nAcademic Background\nBS Computer Science';
      const result = parser.parse(text, 1);
      const sectionTypes = result.sections.map((s) => s.type);
      expect(sectionTypes).toContain('education');
    });
  });
});
