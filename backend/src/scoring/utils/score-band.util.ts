import { ScoreBand } from '../interfaces/rule-result.interface';

interface BandInfo {
  readonly band: ScoreBand;
  readonly label: string;
}

/**
 * Maps a raw score (0-100) to its band and human-readable label.
 * Per ats-scoring-engine.md — "show the band label prominently,
 * the raw number secondarily."
 */
export function getScoreBand(score: number): BandInfo {
  if (score < 0 || score > 100) {
    throw new RangeError(`Score must be 0-100, got ${score}`);
  }

  if (score >= 85) {
    return { band: 'strong', label: 'Strong — minor polish only' };
  }
  if (score >= 65) {
    return { band: 'workable', label: 'Workable — several fixable gaps' };
  }
  if (score >= 40) {
    return { band: 'at-risk', label: 'At risk — likely to be mis-parsed or under-indexed by ATS' };
  }
  return { band: 'high-risk', label: 'High risk — significant rewrite needed' };
}
