/**
 * Structured output interfaces for the Gemini AI insight layer.
 *
 * These match the JSON schema sent to Gemini via `responseSchema`
 * and are validated at runtime by insight-response.validator.ts
 * before reaching the frontend.
 */

/**
 * A single bottleneck identified in the resume.
 * Category maps back to a scoring engine category name so the
 * frontend can visually link AI feedback to the deterministic score.
 */
export interface InsightBottleneck {
  readonly category: string;
  readonly issue: string;
  readonly severity: 'high' | 'medium' | 'low';
}

/**
 * A concrete fix recommendation.
 * `example` should contain a before/after snippet or an illustrative phrase,
 * not a generic platitude.
 */
export interface InsightFix {
  readonly category: string;
  readonly action: string;
  readonly example: string;
}

/**
 * The complete AI insight payload returned from the Gemini call.
 *
 * `source` tracks provenance so the frontend can distinguish
 * real AI insights from static fallback tips.
 */
export interface AiInsightResult {
  readonly bottlenecks: InsightBottleneck[];
  readonly fixes: InsightFix[];
  readonly summary: string;
  readonly source: 'ai' | 'fallback';
}

/**
 * The JSON Schema object sent to Gemini's `responseSchema` parameter.
 * Kept here as the single source of truth so the validator and the
 * API call always agree on shape.
 */
export const AI_INSIGHT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    bottlenecks: {
      type: 'array',
      description: 'Top bottlenecks found in the resume, ordered by severity (highest first).',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'The scoring category this bottleneck belongs to.',
          },
          issue: {
            type: 'string',
            description: 'A 1-2 sentence description of the specific problem.',
          },
          severity: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'Impact severity on ATS parseability.',
          },
        },
        required: ['category', 'issue', 'severity'],
      },
    },
    fixes: {
      type: 'array',
      description: 'The 3 highest-impact actionable fixes, each with a concrete example.',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'The scoring category this fix addresses.',
          },
          action: {
            type: 'string',
            description: 'What the candidate should change.',
          },
          example: {
            type: 'string',
            description: 'A concrete before/after example or illustrative snippet.',
          },
        },
        required: ['category', 'action', 'example'],
      },
    },
    summary: {
      type: 'string',
      description: 'A 2-sentence editorial summary of the resume\'s ATS readiness.',
    },
  },
  required: ['bottlenecks', 'fixes', 'summary'],
} as const;
