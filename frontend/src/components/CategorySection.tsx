import { useState } from 'react';
import type { CategoryResult } from '../types/scoring.types';
import { RuleItem } from './RuleItem';

interface CategorySectionProps {
  readonly category: CategoryResult;
}

/**
 * CategorySection — Hairline-divided diagnostic group with expandable rule audit.
 */
export function CategorySection({ category }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = category.maxPoints > 0
    ? Math.round((category.earnedPoints / category.maxPoints) * 100)
    : 0;

  const passedCount = category.rules.filter((r) => r.passed).length;
  const pctColor =
    pct >= 80
      ? 'text-status-pass bg-status-pass-subtle'
      : pct >= 50
        ? 'text-status-warn bg-status-warn-subtle'
        : 'text-status-fail bg-status-fail-subtle';

  return (
    <div className="border-b border-border-subtle last:border-b-0 py-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group focus-visible:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-ink-primary group-hover:text-brand-marine transition-colors">
            {category.name}
          </h3>
          <p className="text-xs text-ink-faint mt-0.5 tabular-data">
            {passedCount} of {category.rules.length} rules passed
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="tabular-data text-xs font-semibold text-ink-secondary">
            {category.earnedPoints} / {category.maxPoints} pts
          </span>

          <span className={`tabular-data text-xs font-bold px-2 py-0.5 rounded ${pctColor}`}>
            {pct}%
          </span>

          <span
            className={`w-5 h-5 flex items-center justify-center text-ink-faint transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-2 border-t border-border-subtle/50 space-y-1">
          {category.rules.map((rule) => (
            <RuleItem key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}
