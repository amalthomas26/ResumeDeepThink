import { PromptBuilderService } from '../services/prompt-builder.service';
import { ParsedResume } from '../../scoring/interfaces/parsed-resume.interface';
import { ScoreBreakdown } from '../../scoring/interfaces/rule-result.interface';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  const mockParsedResume: ParsedResume = {
    fullText:
      'John Doe\njohn.doe@email.com\n+91 98765 43210\nSoftware Engineer with 5 years experience...',
    sections: [
      {
        type: 'summary',
        headerText: 'Summary',
        content: 'Experienced software engineer...',
        startLine: 3,
        endLine: 5,
        confidence: 0.95,
      },
      {
        type: 'experience',
        headerText: 'Experience',
        content: 'Led development of microservices...',
        startLine: 6,
        endLine: 20,
        confidence: 0.98,
      },
    ],
    contactInfo: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+91 98765 43210',
      linkedinUrl: 'linkedin.com/in/johndoe',
      portfolioUrl: null,
    },
    experienceEntries: [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: 'Jan 2020',
        endDate: 'Present',
        bullets: ['Led development of microservices', 'Reduced latency by 40%'],
      },
    ],
    skillsList: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    wordCount: 450,
    pageCount: 1,
  };

  const mockScoreBreakdown: ScoreBreakdown = {
    checkId: 'test-check-id',
    overallScore: 72,
    maxScore: 100,
    band: 'workable',
    bandLabel: 'Workable — several fixable gaps',
    resumeType: 'tech',
    categories: [],
    ruleResults: [
      {
        id: 'keyword-coverage',
        category: 'Keyword & Skills Alignment',
        passed: false,
        points: 8,
        maxPoints: 15,
        message: 'Keyword coverage is below optimal for tech roles.',
        severity: 'warning',
      },
      {
        id: 'quantified-impact',
        category: 'Experience Quality Signals',
        passed: false,
        points: 3,
        maxPoints: 10,
        message: 'Only 1 of 2 experience bullets contain quantified impact.',
        severity: 'warning',
      },
      {
        id: 'email-present-valid',
        category: 'Contact & Identity Parsing',
        passed: true,
        points: 3,
        maxPoints: 3,
        message: 'Email found and valid.',
        severity: 'pass',
      },
    ],
    meta: {
      wordCount: 450,
      pageCount: 1,
      processingTimeMs: 120,
    },
  };

  describe('buildSystemPrompt', () => {
    it('should include the resume type in the prompt', () => {
      const prompt = service.buildSystemPrompt('tech');
      expect(prompt).toContain('tech roles');
      expect(prompt).toContain('Indian job market');
    });

    it('should include high-reasoning constraints', () => {
      const prompt = service.buildSystemPrompt('finance');
      expect(prompt).toContain('Do NOT hypothesize or speculate');
      expect(prompt).toContain('Do NOT invent issues');
      expect(prompt).toContain('2025-2026');
      expect(prompt).toContain('Double-check');
      expect(prompt).toContain('high reasoning depth');
    });

    it('should include Indian ATS systems in the prompt', () => {
      const prompt = service.buildSystemPrompt('tech');
      expect(prompt).toContain('Naukri RMS');
      expect(prompt).toContain('Workday');
    });
  });

  describe('buildUserContent', () => {
    it('should strip email from the output', () => {
      const content = service.buildUserContent(
        mockParsedResume,
        mockScoreBreakdown,
      );
      expect(content).not.toContain('john.doe@email.com');
    });

    it('should strip phone number from the output', () => {
      const content = service.buildUserContent(
        mockParsedResume,
        mockScoreBreakdown,
      );
      expect(content).not.toContain('+91 98765 43210');
      expect(content).not.toContain('98765 43210');
    });

    it('should include skills list', () => {
      const content = service.buildUserContent(
        mockParsedResume,
        mockScoreBreakdown,
      );
      expect(content).toContain('TypeScript');
      expect(content).toContain('React');
    });

    it('should include experience entries', () => {
      const content = service.buildUserContent(
        mockParsedResume,
        mockScoreBreakdown,
      );
      expect(content).toContain('Senior Software Engineer');
      expect(content).toContain('Tech Corp');
    });

    it('should only include failed/warning rule results, not passed ones', () => {
      const content = service.buildUserContent(
        mockParsedResume,
        mockScoreBreakdown,
      );
      expect(content).toContain('keyword-coverage');
      expect(content).toContain('quantified-impact');
      expect(content).not.toContain('email-present-valid');
    });

    it('should include the resume type', () => {
      const content = service.buildUserContent(
        mockParsedResume,
        mockScoreBreakdown,
      );
      const parsed = JSON.parse(content);
      expect(parsed.resumeType).toBe('tech');
    });

    it('should include score metadata', () => {
      const content = service.buildUserContent(
        mockParsedResume,
        mockScoreBreakdown,
      );
      const parsed = JSON.parse(content);
      expect(parsed.overallScore).toBe(72);
      expect(parsed.band).toBe('workable');
    });

    it('should produce valid JSON', () => {
      const content = service.buildUserContent(
        mockParsedResume,
        mockScoreBreakdown,
      );
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });
});
