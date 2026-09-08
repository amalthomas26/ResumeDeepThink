import type { ScoreBand } from '../types/scoring.types';

const BAND_STYLES: Record<ScoreBand, { bg: string; text: string }> = {
  strong: { bg: 'bg-pine-light', text: 'text-pine' },
  workable: { bg: 'bg-amber-light', text: 'text-ink' },
  'at-risk': { bg: 'bg-amber-light', text: 'text-amber' },
  'high-risk': { bg: 'bg-rust-light', text: 'text-rust' },
};

interface ScoreBandProps {
  readonly score: number;
  readonly band: ScoreBand;
  readonly bandLabel: string;
  readonly resumeType: string;
}

/**
 * The score display: large score number (IBM Plex Mono), band label,
 * and band-colored indicator.
 *
 * Per ats-scoring-engine.md: "Show the band label prominently,
 * the raw number secondarily."
 */
export function ScoreBandDisplay({ score, band, bandLabel, resumeType }: ScoreBandProps) {
  const styles = BAND_STYLES[band] ?? BAND_STYLES['high-risk'];

  return (
    <div className="flex items-start gap-5 sm:gap-8">
      {/* Score number — IBM Plex Mono, large */}
      <div className="score-reveal flex items-baseline bg-ink rounded-xl px-5 py-3 shrink-0">
        <span className="font-mono text-5xl font-bold text-paper leading-none">
          {score}
        </span>
        <span className="font-mono text-lg text-ink-faint ml-1">/100</span>
      </div>

      {/* Band label + resume type */}
      <div className="flex flex-col gap-2 pt-1">
        <span
          className={`inline-block px-3 py-1.5 rounded-md font-mono text-sm font-bold w-fit ${styles.bg} ${styles.text}`}
        >
          {bandLabel}
        </span>
        <span className="text-sm text-ink-faint font-serif">
          Profile: <span className="font-mono font-semibold text-ink uppercase">{resumeType}</span>
        </span>
      </div>
    </div>
  );
}
