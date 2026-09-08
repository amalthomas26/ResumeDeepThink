import type { RuleResult } from '../types/scoring.types';

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pass: { label: 'Pass', bg: 'bg-status-pass-subtle', text: 'text-status-pass', border: 'border-l-status-pass' },
  warning: { label: 'Flag', bg: 'bg-status-warn-subtle', text: 'text-status-warn', border: 'border-l-status-warn' },
  fail: { label: 'Fail', bg: 'bg-status-fail-subtle', text: 'text-status-fail', border: 'border-l-status-fail' },
};

interface RuleItemProps {
  readonly rule: RuleResult;
}

/**
 * A single rule evaluation entry in the diagnostic breakdown.
 */
export function RuleItem({ rule }: RuleItemProps) {
  const config = SEVERITY_CONFIG[rule.severity] ?? SEVERITY_CONFIG.fail;

  return (
    <div className={`py-3.5 border-l-3 pl-4 ${config.border} border-b border-border-subtle/50 last:border-b-0`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${config.bg} ${config.text}`}>
            {config.label}
          </span>
          <span className="text-xs font-semibold text-ink-primary">
            {rule.category}
          </span>
        </div>

        <span className="tabular-data text-xs font-bold text-ink-primary bg-surface-subtle px-2 py-0.5 rounded">
          {rule.points} / {rule.maxPoints} pts
        </span>
      </div>

      <p className="mt-1.5 text-xs text-ink-secondary leading-relaxed">
        {rule.message}
      </p>
    </div>
  );
}
