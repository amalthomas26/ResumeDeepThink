import { useState } from 'react';
import type { CategoryResult } from '../types/scoring.types';
import { RuleItem } from './RuleItem';

interface CategorySectionProps {
  readonly category: CategoryResult;
}

/**
 * A single category in the diagnostic report.
 * Hairline dividers, not cards (per design-and-wireframe.md).
 * Shows category name, earned/max points, and expandable rule list.
 * Uses IBM Plex Mono for data, Source Serif 4 for descriptions.
 */
export function CategorySection({ category }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = category.maxPoints > 0
    ? Math.round((category.earnedPoints / category.maxPoints) * 100)
    : 0;

  const passedCount = category.rules.filter((r) => r.passed).length;

  // Color the percentage based on score quality
  const pctColor = pct >= 80 ? 'text-pine' : pct >= 50 ? 'text-amber' : 'text-rust';

  return (
    <div className="hairline-divider py-4">
      {/* Category header — clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          {/* Category name */}
          <h3 className="text-[15px] font-semibold text-ink font-serif leading-snug">
            {category.name}
          </h3>
          {/* Summary: "3 of 4 rules passed" */}
          <span className="text-xs text-ink-faint font-serif mt-0.5 block">
            {passedCount} of {category.rules.length} rules passed
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Score fraction */}
          <span className="font-mono text-sm font-bold text-ink">
            {category.earnedPoints}/{category.maxPoints}
          </span>

          {/* Percentage badge */}
          <span className={`font-mono text-xs font-bold ${pctColor}`}>
            {pct}%
          </span>

          {/* Expand chevron */}
          <span
            className={`text-ink-faint text-sm transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          >
            ▶
          </span>
        </div>
      </button>

      {/* Expanded rule details */}
      {expanded && (
        <div className="mt-3 space-y-1 pl-1">
          {category.rules.map((rule) => (
            <RuleItem key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}
