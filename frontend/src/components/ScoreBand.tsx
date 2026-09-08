import type { ScoreBand } from '../types/scoring.types';

const BAND_CONFIG: Record<ScoreBand, { bg: string; border: string; text: string; description: string }> = {
  strong: {
    bg: 'bg-status-pass-subtle',
    border: 'border-status-pass/20',
    text: 'text-status-pass',
    description: 'Meets high ATS ranking thresholds with clear section boundaries and strong keyword coverage.',
  },
  workable: {
    bg: 'bg-surface-subtle',
    border: 'border-border-strong',
    text: 'text-ink-primary',
    description: 'Parseable by ATS engines with minor keyword or structural gaps that can be strengthened.',
  },
  'at-risk': {
    bg: 'bg-status-warn-subtle',
    border: 'border-status-warn/30',
    text: 'text-status-warn',
    description: 'Contains parsing obstacles or low keyword alignment that risk screening filtering.',
  },
  'high-risk': {
    bg: 'bg-status-fail-subtle',
    border: 'border-status-fail/30',
    text: 'text-status-fail',
    description: 'Significant formatting or structural issues preventing automated extraction.',
  },
};

interface ScoreBandProps {
  readonly score: number;
  readonly band: ScoreBand;
  readonly bandLabel: string;
  readonly resumeType: string;
}

/**
 * ScoreBandDisplay — Prominent score diagnosis with single deliberate reveal motion.
 */
export function ScoreBandDisplay({ score, band, bandLabel, resumeType }: ScoreBandProps) {
  const config = BAND_CONFIG[band] ?? BAND_CONFIG['high-risk'];

  return (
    <div className="bg-surface-panel border border-border-subtle corner-container p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Score Number & Scale */}
        <div className="flex items-baseline gap-2">
          <div className="score-reveal-moment tabular-data text-6xl sm:text-7xl font-extrabold text-ink-primary tracking-tight leading-none">
            {score}
          </div>
          <span className="text-xl text-ink-faint font-semibold">/100</span>
        </div>

        {/* Diagnosis & Classification */}
        <div className="flex-1 sm:max-w-md">
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className={`inline-flex items-center px-3 py-1 corner-container-sm text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}
            >
              {bandLabel}
            </span>
            <span className="text-xs text-ink-secondary">
              Profile: <strong className="text-ink-primary uppercase">{resumeType}</strong>
            </span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}
