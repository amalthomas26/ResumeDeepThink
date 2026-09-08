import type { CompletedStep } from '../types/scoring.types';

const SEVERITY_BADGES: Record<string, { label: string; style: string }> = {
  pass: { label: 'Pass', style: 'text-status-pass bg-status-pass-subtle border-status-pass/20' },
  warning: { label: 'Flag', style: 'text-status-warn bg-status-warn-subtle border-status-warn/20' },
  fail: { label: 'Fail', style: 'text-status-fail bg-status-fail-subtle border-status-fail/20' },
};

interface ChecklistItemProps {
  readonly step: CompletedStep;
  readonly index: number;
}

/**
 * A resolved step in the scanning progress checklist.
 */
export function ChecklistItem({ step }: ChecklistItemProps) {
  const badge = SEVERITY_BADGES[step.severity] ?? SEVERITY_BADGES.fail;

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle/70 last:border-b-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${badge.style}`}
        >
          {badge.label}
        </span>
        <span className="text-sm font-medium text-ink-primary truncate">
          {step.label}
        </span>
      </div>

      <span className="text-xs text-ink-faint shrink-0">
        {step.category}
      </span>
    </div>
  );
}
