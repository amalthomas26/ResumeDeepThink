import {
  AiInsightResult,
  InsightBottleneck,
  InsightFix,
} from '../interfaces/ai-insight.interface';

const VALID_SEVERITIES = new Set(['high', 'medium', 'low']);

/** Maximum allowed length for the summary field. */
const MAX_SUMMARY_LENGTH = 500;

/**
 * Validates a raw parsed JSON object against the AiInsightResult shape.
 *
 * Replaces Zod — this is a focused ~60-line type-guard that checks every
 * field the frontend depends on. The Gemini `responseSchema` already
 * constrains the model output, so this is the trust-but-verify layer
 * per ai-integration.md: "Never trust an LLM response shape blindly."
 *
 * @returns A typed AiInsightResult if valid, or null on any structural mismatch.
 */
export function validateInsightResponse(
  raw: unknown,
): AiInsightResult | null {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  // --- bottlenecks ---
  if (!Array.isArray(obj.bottlenecks)) {
    return null;
  }
  const bottlenecks: InsightBottleneck[] = [];
  for (const item of obj.bottlenecks) {
    if (!isValidBottleneck(item)) {
      return null;
    }
    bottlenecks.push({
      category: item.category,
      issue: item.issue,
      severity: item.severity,
    });
  }

  // --- fixes ---
  if (!Array.isArray(obj.fixes)) {
    return null;
  }
  const fixes: InsightFix[] = [];
  for (const item of obj.fixes) {
    if (!isValidFix(item)) {
      return null;
    }
    fixes.push({
      category: item.category,
      action: item.action,
      example: item.example,
    });
  }

  // --- summary ---
  if (typeof obj.summary !== 'string' || obj.summary.length === 0) {
    return null;
  }
  const summary =
    obj.summary.length > MAX_SUMMARY_LENGTH
      ? obj.summary.slice(0, MAX_SUMMARY_LENGTH)
      : obj.summary;

  return { bottlenecks, fixes, summary, source: 'ai' };
}

// ─── Helpers ─────────────────────────────────────────────────

function isValidBottleneck(
  item: unknown,
): item is { category: string; issue: string; severity: 'high' | 'medium' | 'low' } {
  if (item === null || item === undefined || typeof item !== 'object') {
    return false;
  }
  const o = item as Record<string, unknown>;
  return (
    typeof o.category === 'string' &&
    o.category.length > 0 &&
    typeof o.issue === 'string' &&
    o.issue.length > 0 &&
    typeof o.severity === 'string' &&
    VALID_SEVERITIES.has(o.severity)
  );
}

function isValidFix(
  item: unknown,
): item is { category: string; action: string; example: string } {
  if (item === null || item === undefined || typeof item !== 'object') {
    return false;
  }
  const o = item as Record<string, unknown>;
  return (
    typeof o.category === 'string' &&
    o.category.length > 0 &&
    typeof o.action === 'string' &&
    o.action.length > 0 &&
    typeof o.example === 'string' &&
    o.example.length > 0
  );
}
