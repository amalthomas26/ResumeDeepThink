import { useCheckStore, selectResult, selectFile } from '../store/check-store';
import { useShallow } from 'zustand/react/shallow';
import { ScoreBandDisplay } from './ScoreBand';
import { CategorySection } from './CategorySection';

/**
 * Results screen — two-pane layout, now populated.
 *
 * Per design-and-wireframe.md:
 * - Right pane: score band + label at top, diagnostic categories below
 *   with hairline dividers (not cards), rule details expandable.
 * - Left pane: file info card + visual score summary (Option A from plan).
 */
export function ResultsScreen() {
  const result = useCheckStore(selectResult);
  const file = useCheckStore(selectFile);
  const reset = useCheckStore(useShallow((s) => s.reset));

  if (!result) return null;

  const passedRules = result.ruleResults.filter((r) => r.passed).length;
  const totalRules = result.ruleResults.length;

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-8">
          <span className="font-mono text-xs font-semibold text-ink-faint uppercase tracking-widest">
            ResumePro
          </span>
          <button
            type="button"
            onClick={reset}
            className="font-serif text-sm font-semibold text-pine hover:text-pine/80
                       transition-colors cursor-pointer"
          >
            ← Check another resume
          </button>
        </div>

        {/* Two-pane layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Left pane — file info + visual score summary */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div
              className="relative bg-paper rounded-sm overflow-hidden"
              style={{
                aspectRatio: '8.5 / 11',
                boxShadow: '0 4px 20px rgba(22, 33, 61, 0.08)',
              }}
            >
              {/* Score overview inside the "paper" */}
              <div className="p-8 h-full flex flex-col">
                {/* File info */}
                {file && (
                  <div className="mb-6">
                    <p className="font-serif text-lg font-bold text-ink truncate">
                      {file.name}
                    </p>
                    <p className="font-mono text-xs text-ink-faint mt-1">
                      {(file.size / 1024).toFixed(1)} KB · {result.meta.pageCount} page{result.meta.pageCount !== 1 ? 's' : ''} · {result.meta.wordCount.toLocaleString()} words
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-border mb-6" />

                {/* Large centered score */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="score-reveal text-center">
                    <div className="font-mono text-7xl font-bold text-ink leading-none">
                      {result.overallScore}
                    </div>
                    <div className="font-mono text-lg text-ink-faint mt-1">/100</div>
                  </div>

                  {/* Score ring visualization */}
                  <div className="mt-6 w-full max-w-[240px]">
                    <div className="h-2 bg-canvas rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${result.overallScore}%`,
                          backgroundColor:
                            result.overallScore >= 85
                              ? 'var(--color-pine)'
                              : result.overallScore >= 65
                                ? 'var(--color-amber)'
                                : 'var(--color-rust)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Rule summary */}
                  <p className="mt-4 font-serif text-sm text-ink-muted text-center">
                    {passedRules} of {totalRules} rules passed
                  </p>
                </div>

                {/* Meta info at bottom */}
                <div className="mt-auto pt-6 border-t border-border-light">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-mono text-[10px] text-ink-faint uppercase tracking-wider block">
                        Profile
                      </span>
                      <span className="font-mono text-sm font-semibold text-ink uppercase">
                        {result.resumeType}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-ink-faint uppercase tracking-wider block">
                        Processing
                      </span>
                      <span className="font-mono text-sm font-semibold text-ink">
                        {result.meta.processingTimeMs}ms
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-mono text-[10px] text-ink-faint uppercase tracking-wider block">
                        Check ID
                      </span>
                      <span className="font-mono text-xs text-ink-muted">
                        {result.checkId.slice(0, 12)}…
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right pane — diagnostic report */}
          <div className="flex-1 min-w-0">
            {/* Score band */}
            <ScoreBandDisplay
              score={result.overallScore}
              band={result.band}
              bandLabel={result.bandLabel}
              resumeType={result.resumeType}
            />

            {/* Category breakdown — hairline dividers, not cards */}
            <div className="mt-8">
              <h2 className="font-serif text-lg font-bold text-ink mb-2">
                Diagnostic Report
              </h2>
              <p className="font-serif text-sm text-ink-faint mb-4">
                {result.categories.length} categories · {totalRules} rules evaluated
              </p>

              <div className="bg-paper rounded-lg border border-border px-5">
                {result.categories.map((cat) => (
                  <CategorySection key={cat.name} category={cat} />
                ))}
              </div>
            </div>

            {/* Check another resume (bottom CTA) */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={reset}
                className="font-serif text-sm font-bold text-pine hover:text-pine/80
                           border border-pine/30 hover:border-pine/50
                           px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Check another resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
