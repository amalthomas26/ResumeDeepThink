import type { AiInsightResult } from '../types/scoring.types';

const SEVERITY_STYLES = {
  high: {
    dot: 'bg-status-fail',
    badge: 'bg-status-fail-subtle text-status-fail border-status-fail/20',
    label: 'High impact',
  },
  medium: {
    dot: 'bg-status-warn',
    badge: 'bg-status-warn-subtle text-status-warn border-status-warn/20',
    label: 'Medium impact',
  },
  low: {
    dot: 'bg-ink-faint',
    badge: 'bg-surface-subtle text-ink-secondary border-border-subtle',
    label: 'Low impact',
  },
} as const;

interface AiInsightsSectionProps {
  readonly aiInsights: AiInsightResult | null | undefined;
}

/**
 * AiInsightsSection — Actionable bottleneck breakdown and recommended fixes.
 */
export function AiInsightsSection({ aiInsights }: AiInsightsSectionProps) {
  if (aiInsights === undefined) {
    return <InsightsLoading />;
  }

  if (aiInsights === null) {
    return <InsightsUnavailable />;
  }

  const { bottlenecks, fixes, summary, source } = aiInsights;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-bold text-ink-primary tracking-tight">
          Optimization Recommendations
        </h2>
        {source === 'fallback' && (
          <span className="text-[11px] font-semibold text-ink-secondary bg-surface-subtle px-2.5 py-0.5 rounded border border-border-subtle">
            Standard Rubric
          </span>
        )}
      </div>

      <p className="text-sm text-ink-secondary leading-relaxed mb-4">
        {summary}
      </p>

      <div className="bg-surface-panel border border-border-subtle corner-container shadow-xs">
        {/* Bottlenecks */}
        {bottlenecks.length > 0 && (
          <div className="p-5 sm:p-6 border-b border-border-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-3">
              Identified Screening Obstacles
            </h3>
            <div className="space-y-3">
              {bottlenecks.map((bottleneck, i) => {
                const style = SEVERITY_STYLES[bottleneck.severity];
                return (
                  <div key={`bottleneck-${i}`} className="p-3 bg-surface-subtle corner-container-sm border border-border-subtle/60">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-ink-primary">
                        {bottleneck.category}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {bottleneck.issue}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Fixes */}
        {fixes.length > 0 && (
          <div className="p-5 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-3">
              Actionable Fixes
            </h3>
            <div className="space-y-4">
              {fixes.map((fix, i) => (
                <div key={`fix-${i}`} className="border-b border-border-subtle/60 pb-3.5 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-marine text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-marine mb-0.5">
                        {fix.category}
                      </div>
                      <p className="text-sm font-bold text-ink-primary mb-2">
                        {fix.action}
                      </p>
                      <div className="bg-surface-subtle p-3 corner-container-sm border border-border-subtle/80 text-xs text-ink-secondary leading-relaxed font-sans">
                        {fix.example}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightsLoading() {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-ink-primary mb-3">
        Optimization Recommendations
      </h2>
      <div className="bg-surface-panel border border-border-subtle corner-container p-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-brand-marine border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-secondary">
            Generating targeted recommendations…
          </p>
        </div>
      </div>
    </div>
  );
}

function InsightsUnavailable() {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-ink-primary mb-3">
        Optimization Recommendations
      </h2>
      <div className="bg-surface-panel border border-border-subtle corner-container p-6 text-center">
        <p className="text-xs text-ink-faint">
          AI insights temporarily deferred. Deterministic scoring above is fully validated.
        </p>
      </div>
    </div>
  );
}
