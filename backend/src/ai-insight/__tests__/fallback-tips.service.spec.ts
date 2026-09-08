import { FallbackTipsService } from '../services/fallback-tips.service';
import { CategoryResult } from '../../scoring/interfaces/rule-result.interface';

describe('FallbackTipsService', () => {
  let service: FallbackTipsService;

  beforeEach(() => {
    service = new FallbackTipsService();
  });

  const allCategories: CategoryResult[] = [
    {
      name: 'File & Format Integrity',
      earnedPoints: 10,
      maxPoints: 15,
      rules: [
        {
          id: 'text-layer-extractable',
          category: 'File & Format Integrity',
          passed: false,
          points: 0,
          maxPoints: 5,
          message: 'No extractable text layer found.',
          severity: 'fail',
        },
      ],
    },
    {
      name: 'Contact & Identity Parsing',
      earnedPoints: 8,
      maxPoints: 10,
      rules: [
        {
          id: 'linkedin-or-portfolio',
          category: 'Contact & Identity Parsing',
          passed: false,
          points: 0,
          maxPoints: 2,
          message: 'No LinkedIn or portfolio URL detected.',
          severity: 'warning',
        },
      ],
    },
    {
      name: 'Structural Parsing',
      earnedPoints: 20,
      maxPoints: 20,
      rules: [
        {
          id: 'standard-sections-detected',
          category: 'Structural Parsing',
          passed: true,
          points: 10,
          maxPoints: 10,
          message: 'All standard sections found.',
          severity: 'pass',
        },
      ],
    },
    {
      name: 'Keyword & Skills Alignment',
      earnedPoints: 15,
      maxPoints: 25,
      rules: [
        {
          id: 'keyword-coverage',
          category: 'Keyword & Skills Alignment',
          passed: false,
          points: 8,
          maxPoints: 15,
          message: 'Keyword coverage below optimal.',
          severity: 'fail',
        },
      ],
    },
  ];

  it('should return an AiInsightResult with source "fallback"', () => {
    const result = service.generateFallbackTips(allCategories);
    expect(result.source).toBe('fallback');
  });

  it('should only include tips for categories with failed/warning rules', () => {
    const result = service.generateFallbackTips(allCategories);
    const categoryNames = result.bottlenecks.map((b) => b.category);

    // Structural Parsing has only passing rules — should NOT appear
    expect(categoryNames).not.toContain('Structural Parsing');

    // File & Format, Contact, Keywords all have issues
    expect(categoryNames).toContain('File & Format Integrity');
    expect(categoryNames).toContain('Contact & Identity Parsing');
    expect(categoryNames).toContain('Keyword & Skills Alignment');
  });

  it('should have matching bottleneck and fix counts', () => {
    const result = service.generateFallbackTips(allCategories);
    expect(result.bottlenecks.length).toBe(result.fixes.length);
  });

  it('should assign "high" severity for categories with "fail" rules', () => {
    const result = service.generateFallbackTips(allCategories);
    const fileFormatBottleneck = result.bottlenecks.find(
      (b) => b.category === 'File & Format Integrity',
    );
    expect(fileFormatBottleneck?.severity).toBe('high');
  });

  it('should assign "medium" severity for categories with only "warning" rules', () => {
    const result = service.generateFallbackTips(allCategories);
    const contactBottleneck = result.bottlenecks.find(
      (b) => b.category === 'Contact & Identity Parsing',
    );
    expect(contactBottleneck?.severity).toBe('medium');
  });

  it('should generate a summary string', () => {
    const result = service.generateFallbackTips(allCategories);
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('should return a generic positive summary when no categories have issues', () => {
    const passingCategories: CategoryResult[] = [
      {
        name: 'File & Format Integrity',
        earnedPoints: 15,
        maxPoints: 15,
        rules: [
          {
            id: 'file-is-valid-document',
            category: 'File & Format Integrity',
            passed: true,
            points: 5,
            maxPoints: 5,
            message: 'Valid document format.',
            severity: 'pass',
          },
        ],
      },
    ];
    const result = service.generateFallbackTips(passingCategories);
    expect(result.bottlenecks).toHaveLength(0);
    expect(result.fixes).toHaveLength(0);
    expect(result.summary).toContain('solid');
  });

  it('should have non-empty issue, action, and example for each tip', () => {
    const result = service.generateFallbackTips(allCategories);
    for (const bottleneck of result.bottlenecks) {
      expect(bottleneck.issue.length).toBeGreaterThan(0);
    }
    for (const fix of result.fixes) {
      expect(fix.action.length).toBeGreaterThan(0);
      expect(fix.example.length).toBeGreaterThan(0);
    }
  });
});
