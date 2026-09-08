import { validateInsightResponse } from '../validators/insight-response.validator';

describe('validateInsightResponse', () => {
  const validResponse = {
    bottlenecks: [
      {
        category: 'Keyword & Skills Alignment',
        issue: 'Missing critical tech keywords like TypeScript and Docker.',
        severity: 'high',
      },
      {
        category: 'Experience Quality Signals',
        issue: 'Bullet points lack quantified impact metrics.',
        severity: 'medium',
      },
    ],
    fixes: [
      {
        category: 'Keyword & Skills Alignment',
        action: 'Add a dedicated Skills section with relevant hard skills.',
        example: 'Skills: React, TypeScript, Node.js, Docker, AWS, CI/CD',
      },
      {
        category: 'Experience Quality Signals',
        action: 'Start bullets with action verbs and include metrics.',
        example:
          'Before: "Worked on projects."\nAfter: "Led 3 cross-functional projects, reducing delivery time by 30%."',
      },
    ],
    summary:
      'Your resume has strong structural fundamentals but lacks ATS-critical keywords in the tech domain. Adding a clean skills section and quantifying your impact will significantly improve parseability.',
  };

  it('should validate and return a correct AiInsightResult for valid input', () => {
    const result = validateInsightResponse(validResponse);
    expect(result).not.toBeNull();
    expect(result!.source).toBe('ai');
    expect(result!.bottlenecks).toHaveLength(2);
    expect(result!.fixes).toHaveLength(2);
    expect(result!.summary).toBe(validResponse.summary);
  });

  it('should return null for null input', () => {
    expect(validateInsightResponse(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(validateInsightResponse(undefined)).toBeNull();
  });

  it('should return null for a non-object input', () => {
    expect(validateInsightResponse('string')).toBeNull();
    expect(validateInsightResponse(42)).toBeNull();
    expect(validateInsightResponse(true)).toBeNull();
  });

  it('should return null when bottlenecks is missing', () => {
    const { bottlenecks: _, ...rest } = validResponse;
    expect(validateInsightResponse(rest)).toBeNull();
  });

  it('should return null when bottlenecks is not an array', () => {
    expect(
      validateInsightResponse({ ...validResponse, bottlenecks: 'not-array' }),
    ).toBeNull();
  });

  it('should return null when a bottleneck has invalid severity', () => {
    const bad = {
      ...validResponse,
      bottlenecks: [
        { category: 'Test', issue: 'Test issue', severity: 'critical' },
      ],
    };
    expect(validateInsightResponse(bad)).toBeNull();
  });

  it('should return null when a bottleneck is missing category', () => {
    const bad = {
      ...validResponse,
      bottlenecks: [{ issue: 'Test', severity: 'high' }],
    };
    expect(validateInsightResponse(bad)).toBeNull();
  });

  it('should return null when a bottleneck has empty issue string', () => {
    const bad = {
      ...validResponse,
      bottlenecks: [{ category: 'Test', issue: '', severity: 'high' }],
    };
    expect(validateInsightResponse(bad)).toBeNull();
  });

  it('should return null when fixes is missing', () => {
    const { fixes: _, ...rest } = validResponse;
    expect(validateInsightResponse(rest)).toBeNull();
  });

  it('should return null when fixes is not an array', () => {
    expect(
      validateInsightResponse({ ...validResponse, fixes: {} }),
    ).toBeNull();
  });

  it('should return null when a fix is missing action', () => {
    const bad = {
      ...validResponse,
      fixes: [{ category: 'Test', example: 'Example text' }],
    };
    expect(validateInsightResponse(bad)).toBeNull();
  });

  it('should return null when a fix has empty example', () => {
    const bad = {
      ...validResponse,
      fixes: [{ category: 'Test', action: 'Do something', example: '' }],
    };
    expect(validateInsightResponse(bad)).toBeNull();
  });

  it('should return null when summary is missing', () => {
    const { summary: _, ...rest } = validResponse;
    expect(validateInsightResponse(rest)).toBeNull();
  });

  it('should return null when summary is not a string', () => {
    expect(
      validateInsightResponse({ ...validResponse, summary: 123 }),
    ).toBeNull();
  });

  it('should return null when summary is empty', () => {
    expect(
      validateInsightResponse({ ...validResponse, summary: '' }),
    ).toBeNull();
  });

  it('should truncate summary longer than 500 chars', () => {
    const longSummary = 'A'.repeat(600);
    const result = validateInsightResponse({
      ...validResponse,
      summary: longSummary,
    });
    expect(result).not.toBeNull();
    expect(result!.summary).toHaveLength(500);
  });

  it('should accept empty bottlenecks array', () => {
    const result = validateInsightResponse({
      ...validResponse,
      bottlenecks: [],
    });
    expect(result).not.toBeNull();
    expect(result!.bottlenecks).toHaveLength(0);
  });

  it('should accept empty fixes array', () => {
    const result = validateInsightResponse({
      ...validResponse,
      fixes: [],
    });
    expect(result).not.toBeNull();
    expect(result!.fixes).toHaveLength(0);
  });

  it('should accept all three severity levels', () => {
    for (const severity of ['high', 'medium', 'low']) {
      const result = validateInsightResponse({
        ...validResponse,
        bottlenecks: [
          { category: 'Test', issue: 'Issue text', severity },
        ],
      });
      expect(result).not.toBeNull();
      expect(result!.bottlenecks[0].severity).toBe(severity);
    }
  });
});
