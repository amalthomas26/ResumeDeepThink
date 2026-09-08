import type { CompletedStep } from '../types/scoring.types';

const SEVERITY_ICON: Record<string, string> = {
  pass: '✓',
  warning: '⚠',
  fail: '✗',
};

const SEVERITY_STYLES: Record<string, string> = {
  pass: 'text-pine bg-pine-light',
  warning: 'text-amber bg-amber-light',
  fail: 'text-rust bg-rust-light',
};

interface ChecklistItemProps {
  readonly step: CompletedStep;
  readonly index: number;
}

/**
 * A single resolved step in the scanning checklist.
 * Animates in with a staggered delay based on index.
 */
export function ChecklistItem({ step, index }: ChecklistItemProps) {
  return (
    <div
      className="step-enter flex items-center gap-3 py-2.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Severity indicator */}
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono shrink-0 ${SEVERITY_STYLES[step.severity] ?? ''}`}
      >
        {SEVERITY_ICON[step.severity] ?? '?'}
      </span>

      {/* Label */}
      <span className="font-serif text-sm text-ink leading-tight">
        {step.label}
      </span>

      {/* Category tag */}
      <span className="ml-auto text-[11px] font-mono text-ink-faint uppercase tracking-wide whitespace-nowrap">
        {step.category}
      </span>
    </div>
  );
}
