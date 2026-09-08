import {
  checkDatesPresentConsistent,
  checkActionVerbsUsed,
  checkQuantifiedImpact,
  runExperienceRules,
} from '../experience.rules';
import { ParsedResume, ExperienceEntry } from '../../interfaces/parsed-resume.interface';
import { techProfile } from '../../profiles/tech.profile';

const makeResume = (entries: ExperienceEntry[]): ParsedResume => ({
  fullText: '',
  sections: [],
  contactInfo: { name: null, email: null, phone: null, linkedinUrl: null, portfolioUrl: null },
  experienceEntries: entries,
  skillsList: [],
  wordCount: 300,
  pageCount: 1,
});

const goodEntry: ExperienceEntry = {
  title: 'Senior Engineer',
  company: 'TechCorp',
  startDate: 'Jan 2020',
  endDate: 'Present',
  bullets: [
    'Architected a microservices migration that reduced deployment time by 60%',
    'Led a team of 8 engineers to deliver a React dashboard serving 50K+ users',
    'Optimized database queries resulting in 40% latency reduction',
  ],
};

const weakEntry: ExperienceEntry = {
  title: 'Developer',
  company: 'SomeCo',
  startDate: null,
  endDate: null,
  bullets: [
    'Responsible for JavaScript development',
    'Responsible for React development',
    'Responsible for maintaining code',
    'Used JavaScript to build things',
  ],
};

describe('Experience Quality Rules (20 pts)', () => {
  describe('checkDatesPresentConsistent (5 pts)', () => {
    it('should award 5 pts when all entries have dates', () => {
      const result = checkDatesPresentConsistent(makeResume([goodEntry]));
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts when no entries have dates', () => {
      const result = checkDatesPresentConsistent(makeResume([weakEntry]));
      expect(result.points).toBe(0);
      expect(result.message).toContain('No employment dates');
    });

    it('should award proportional points for mixed dates', () => {
      const result = checkDatesPresentConsistent(makeResume([goodEntry, weakEntry]));
      // 1/2 entries = 3 pts (rounded)
      expect(result.points).toBe(3);
    });

    it('should handle no experience entries gracefully (edge case)', () => {
      const result = checkDatesPresentConsistent(makeResume([]));
      expect(result.points).toBe(0);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('No experience entries');
    });
  });

  describe('checkActionVerbsUsed (5 pts)', () => {
    it('should award 5 pts for strong action verb usage', () => {
      const result = checkActionVerbsUsed(makeResume([goodEntry]), techProfile);
      expect(result.points).toBe(5);
      expect(result.passed).toBe(true);
    });

    it('should penalize "Responsible for" pattern', () => {
      const result = checkActionVerbsUsed(makeResume([weakEntry]), techProfile);
      expect(result.points).toBeLessThan(5);
      expect(result.message).toContain('Responsible for');
    });

    it('should handle no bullets gracefully', () => {
      const entry: ExperienceEntry = {
        ...goodEntry,
        bullets: [],
      };
      const result = checkActionVerbsUsed(makeResume([entry]), techProfile);
      expect(result.points).toBe(0);
      expect(result.severity).toBe('warning');
    });
  });

  describe('checkQuantifiedImpact (10 pts)', () => {
    it('should award high points for quantified bullets', () => {
      const result = checkQuantifiedImpact(makeResume([goodEntry]), techProfile);
      expect(result.points).toBeGreaterThanOrEqual(8);
    });

    it('should award 0 pts for bullets with no metrics', () => {
      const result = checkQuantifiedImpact(makeResume([weakEntry]), techProfile);
      expect(result.points).toBe(0);
      expect(result.message).toContain('No quantified achievements');
    });

    it('should handle no bullets gracefully', () => {
      const entry: ExperienceEntry = { ...goodEntry, bullets: [] };
      const result = checkQuantifiedImpact(makeResume([entry]), techProfile);
      expect(result.points).toBe(0);
    });

    it('should count proportionally, not just detect presence', () => {
      const entry: ExperienceEntry = {
        ...goodEntry,
        bullets: [
          'Reduced latency by 40%',
          'Worked on backend systems',
          'Helped with frontend tasks',
          'Did various development work',
        ],
      };
      const result = checkQuantifiedImpact(makeResume([entry]), techProfile);
      // 1/4 bullets = ~2-3 pts out of 10
      expect(result.points).toBeGreaterThan(0);
      expect(result.points).toBeLessThan(8);
    });
  });

  describe('runExperienceRules (all 3 rules)', () => {
    it('should return 3 results for any input', () => {
      const results = runExperienceRules(makeResume([goodEntry]), techProfile);
      expect(results).toHaveLength(3);
    });

    it('should total 20 pts for excellent experience entries', () => {
      const results = runExperienceRules(makeResume([goodEntry]), techProfile);
      const total = results.reduce((sum, r) => sum + r.points, 0);
      expect(total).toBeGreaterThanOrEqual(15);
    });
  });
});
