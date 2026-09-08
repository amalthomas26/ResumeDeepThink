import type { RuleResult } from '../types/scoring.types';

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pass: { bg: 'bg-pine-light', text: 'text-pine', border: 'border-l-pine' },
  warning: { bg: 'bg-amber-light', text: 'text-amber', border: 'border-l-amber' },
  fail: { bg: 'bg-rust-light', text: 'text-rust', border: 'border-l-rust' },
};

interface RuleItemProps {
  readonly rule: RuleResult;
}

/**
 * A single rule result in the diagnostic report.
 * Shows severity tag (PASS/FLAG in Plex Mono), points, and message.
 * Uses Pine/Rust color coding per design tokens.
 */
export function RuleItem({ rule }: RuleItemProps) {
  const colors = SEVERITY_COLORS[rule.severity] ?? SEVERITY_COLORS.fail;
  const tagLabel = rule.severity === 'pass' ? 'PASS' : rule.severity === 'warning' ? 'FLAG' : 'FAIL';

  return (
    <div className={`py-3 border-l-2 pl-4 ${colors.border}`}>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Severity tag */}
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider ${colors.bg} ${colors.text}`}
        >
          {tagLabel}
        </span>

        {/* Points */}
        <span className="font-mono text-sm font-semibold text-ink">
          {rule.points}/{rule.maxPoints}
        </span>
      </div>

      {/* Message */}
      <p className="mt-1.5 text-sm text-ink-muted leading-relaxed font-serif">
        {rule.message}
      </p>
    </div>
  );
}
