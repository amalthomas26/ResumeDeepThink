import { AiInsightService } from '../services/ai-insight.service';
import { PromptBuilderService } from '../services/prompt-builder.service';
import { FallbackTipsService } from '../services/fallback-tips.service';
import { ParsedResume } from '../../scoring/interfaces/parsed-resume.interface';
import { ScoreBreakdown } from '../../scoring/interfaces/rule-result.interface';
import { AiInsightResult } from '../interfaces/ai-insight.interface';
import type { ConfigService as ConfigServiceType } from '@nestjs/config';

// Mock @nestjs/config to avoid ESM import error in Jest
jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ConfigService } = require('@nestjs/config');

// Mock the @google/genai module
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
    },
  })),
}));

describe('AiInsightService', () => {
  let service: AiInsightService;
  let configService: ConfigServiceType;
  let promptBuilder: PromptBuilderService;
  let fallbackTips: FallbackTipsService;

  const mockParsedResume: ParsedResume = {
    fullText: 'Test resume text',
    sections: [],
    contactInfo: {
      name: 'Test',
      email: null,
      phone: null,
      linkedinUrl: null,
      portfolioUrl: null,
    },
    experienceEntries: [],
    skillsList: ['TypeScript'],
    wordCount: 100,
    pageCount: 1,
  };

  const mockScoreBreakdown: ScoreBreakdown = {
    checkId: 'test-id',
    overallScore: 65,
    maxScore: 100,
    band: 'workable',
    bandLabel: 'Workable',
    resumeType: 'tech',
    categories: [
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
            message: 'Low coverage',
            severity: 'warning',
          },
        ],
      },
    ],
    ruleResults: [
      {
        id: 'keyword-coverage',
        category: 'Keyword & Skills Alignment',
        passed: false,
        points: 8,
        maxPoints: 15,
        message: 'Low coverage',
        severity: 'warning',
      },
    ],
    meta: { wordCount: 100, pageCount: 1, processingTimeMs: 50 },
  };

  const validGeminiResponse: Omit<AiInsightResult, 'source'> = {
    bottlenecks: [
      {
        category: 'Keyword & Skills Alignment',
        issue: 'Missing key tech skills.',
        severity: 'high',
      },
    ],
    fixes: [
      {
        category: 'Keyword & Skills Alignment',
        action: 'Add Docker and AWS to skills.',
        example: 'Skills: TypeScript, Docker, AWS',
      },
    ],
    summary: 'Resume needs more keywords for ATS parsing.',
  };

  const mockFallbackResult: AiInsightResult = {
    bottlenecks: [
      {
        category: 'Keyword & Skills Alignment',
        issue: 'Generic fallback tip.',
        severity: 'high',
      },
    ],
    fixes: [
      {
        category: 'Keyword & Skills Alignment',
        action: 'Add relevant skills.',
        example: 'Skills: React, Node.js',
      },
    ],
    summary: 'Fallback summary.',
    source: 'fallback',
  };

  function createService(apiKey: string | undefined = 'test-api-key') {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'GEMINI_API_KEY') return apiKey;
        if (key === 'GEMINI_MODEL') return 'gemini-3.5-flash';
        return undefined;
      }),
    } as unknown as ConfigServiceType;

    promptBuilder = new PromptBuilderService();
    fallbackTips = new FallbackTipsService();

    jest
      .spyOn(fallbackTips, 'generateFallbackTips')
      .mockReturnValue(mockFallbackResult);

    service = new AiInsightService(configService, promptBuilder, fallbackTips);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when API key is missing', () => {
    it('should return fallback tips immediately', async () => {
      createService(undefined);

      const result = await service.generateInsights(
        mockParsedResume,
        mockScoreBreakdown,
      );

      expect(result.source).toBe('fallback');
      expect(fallbackTips.generateFallbackTips).toHaveBeenCalledWith(
        mockScoreBreakdown.categories,
      );
    });
  });

  describe('when API key is present', () => {
    beforeEach(() => {
      createService('test-api-key');
    });

    it('should return AI insights on valid response', async () => {
      // Access the mock client's generateContent method
      const { GoogleGenAI } = require('@google/genai');
      const mockInstance = GoogleGenAI.mock.results[0]?.value;
      if (mockInstance) {
        mockInstance.models.generateContent.mockResolvedValue({
          text: JSON.stringify(validGeminiResponse),
        });
      }

      const result = await service.generateInsights(
        mockParsedResume,
        mockScoreBreakdown,
      );

      expect(result.source).toBe('ai');
      expect(result.bottlenecks).toHaveLength(1);
      expect(result.fixes).toHaveLength(1);
    });

    it('should retry once on malformed response then fall back', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockInstance = GoogleGenAI.mock.results[0]?.value;
      if (mockInstance) {
        // First call: malformed, Second call: also malformed
        mockInstance.models.generateContent
          .mockResolvedValueOnce({ text: '{"invalid": true}' })
          .mockResolvedValueOnce({ text: '{"also_invalid": true}' });
      }

      const result = await service.generateInsights(
        mockParsedResume,
        mockScoreBreakdown,
      );

      expect(result.source).toBe('fallback');
      expect(fallbackTips.generateFallbackTips).toHaveBeenCalled();
    });

    it('should fall back on empty text response', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockInstance = GoogleGenAI.mock.results[0]?.value;
      if (mockInstance) {
        mockInstance.models.generateContent
          .mockResolvedValueOnce({ text: '' })
          .mockResolvedValueOnce({ text: '' });
      }

      const result = await service.generateInsights(
        mockParsedResume,
        mockScoreBreakdown,
      );

      expect(result.source).toBe('fallback');
    });

    it('should fall back on non-JSON text response', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockInstance = GoogleGenAI.mock.results[0]?.value;
      if (mockInstance) {
        mockInstance.models.generateContent
          .mockResolvedValueOnce({ text: 'not valid json' })
          .mockResolvedValueOnce({ text: 'still not json' });
      }

      const result = await service.generateInsights(
        mockParsedResume,
        mockScoreBreakdown,
      );

      expect(result.source).toBe('fallback');
    });

    it('should fall back on API error', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockInstance = GoogleGenAI.mock.results[0]?.value;
      if (mockInstance) {
        mockInstance.models.generateContent
          .mockRejectedValueOnce(new Error('API error'))
          .mockRejectedValueOnce(new Error('API error again'));
      }

      const result = await service.generateInsights(
        mockParsedResume,
        mockScoreBreakdown,
      );

      expect(result.source).toBe('fallback');
    });

    it('should succeed on retry after first failure', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockInstance = GoogleGenAI.mock.results[0]?.value;
      if (mockInstance) {
        // First call fails, second succeeds
        mockInstance.models.generateContent
          .mockResolvedValueOnce({ text: '{"broken": true}' })
          .mockResolvedValueOnce({
            text: JSON.stringify(validGeminiResponse),
          });
      }

      const result = await service.generateInsights(
        mockParsedResume,
        mockScoreBreakdown,
      );

      expect(result.source).toBe('ai');
    });
  });
});
