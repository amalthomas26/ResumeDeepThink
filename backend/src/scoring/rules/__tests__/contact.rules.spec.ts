import {
  checkNameDetected,
  checkEmailPresent,
  checkPhonePresent,
  checkLinkedInOrPortfolio,
  runContactRules,
} from '../contact.rules';
import { ParsedResume, ContactInfo } from '../../interfaces/parsed-resume.interface';

const makeResume = (contactOverrides: Partial<ContactInfo> = {}): ParsedResume => ({
  fullText: '',
  sections: [],
  contactInfo: {
    name: 'John Smith',
    email: 'john@email.com',
    phone: '+1 555-123-4567',
    linkedinUrl: 'linkedin.com/in/johnsmith',
    portfolioUrl: null,
    ...contactOverrides,
  },
  experienceEntries: [],
  skillsList: [],
  wordCount: 300,
  pageCount: 1,
});

describe('Contact & Identity Rules (10 pts)', () => {
  describe('checkNameDetected (3 pts)', () => {
    it('should award 3 pts when name is detected', () => {
      const result = checkNameDetected(makeResume());
      expect(result.points).toBe(3);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts when name is null', () => {
      const result = checkNameDetected(makeResume({ name: null }));
      expect(result.points).toBe(0);
      expect(result.passed).toBe(false);
    });

    it('should award 0 pts when name is empty string', () => {
      const result = checkNameDetected(makeResume({ name: '  ' }));
      expect(result.points).toBe(0);
    });
  });

  describe('checkEmailPresent (3 pts)', () => {
    it('should award 3 pts for valid email', () => {
      const result = checkEmailPresent(makeResume());
      expect(result.points).toBe(3);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts when no email', () => {
      const result = checkEmailPresent(makeResume({ email: null }));
      expect(result.points).toBe(0);
    });

    it('should award 0 pts for invalid email format', () => {
      const result = checkEmailPresent(makeResume({ email: 'not-an-email' }));
      expect(result.points).toBe(0);
    });
  });

  describe('checkPhonePresent (2 pts)', () => {
    it('should award 2 pts when phone is present', () => {
      const result = checkPhonePresent(makeResume());
      expect(result.points).toBe(2);
      expect(result.passed).toBe(true);
    });

    it('should award 0 pts when no phone', () => {
      const result = checkPhonePresent(makeResume({ phone: null }));
      expect(result.points).toBe(0);
    });

    it('should award 2 pts for Indian phone format', () => {
      const result = checkPhonePresent(makeResume({ phone: '+91 98765 43210' }));
      expect(result.points).toBe(2);
    });
  });

  describe('checkLinkedInOrPortfolio (2 pts)', () => {
    it('should award 2 pts for LinkedIn URL', () => {
      const result = checkLinkedInOrPortfolio(makeResume());
      expect(result.points).toBe(2);
    });

    it('should award 2 pts for portfolio URL only', () => {
      const result = checkLinkedInOrPortfolio(
        makeResume({ linkedinUrl: null, portfolioUrl: 'https://mysite.com' }),
      );
      expect(result.points).toBe(2);
    });

    it('should award 2 pts when both LinkedIn and portfolio present', () => {
      const result = checkLinkedInOrPortfolio(
        makeResume({ portfolioUrl: 'https://mysite.com' }),
      );
      expect(result.points).toBe(2);
      expect(result.message).toContain('LinkedIn profile and portfolio');
    });

    it('should award 0 pts when neither present', () => {
      const result = checkLinkedInOrPortfolio(
        makeResume({ linkedinUrl: null, portfolioUrl: null }),
      );
      expect(result.points).toBe(0);
    });
  });

  describe('runContactRules (all 4 rules)', () => {
    it('should return 4 results totaling 10 pts for complete contact info', () => {
      const results = runContactRules(makeResume());
      expect(results).toHaveLength(4);
      const total = results.reduce((sum, r) => sum + r.points, 0);
      expect(total).toBe(10);
    });

    it('should return 0 pts for completely empty contact info', () => {
      const results = runContactRules(
        makeResume({ name: null, email: null, phone: null, linkedinUrl: null }),
      );
      const total = results.reduce((sum, r) => sum + r.points, 0);
      expect(total).toBe(0);
    });
  });
});
