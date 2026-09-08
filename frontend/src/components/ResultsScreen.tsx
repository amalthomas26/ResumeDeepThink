import { useCheckStore, selectResult, selectFile } from '../store/check-store';
import { useShallow } from 'zustand/react/shallow';
import { ScoreBandDisplay } from './ScoreBand';
import { CategorySection } from './CategorySection';
import { AiInsightsSection } from './AiInsightsSection';

/**
 * ResultsScreen — Two-pane diagnostic evaluation report.
 * Calm authority, zero generic SaaS tells, single score reveal motion.
 */
export function ResultsScreen() {
  const result = useCheckStore(selectResult);
  const file = useCheckStore(selectFile);
  const { reset, rescoreWithType } = useCheckStore(
    useShallow((s) => ({
      reset: s.reset,
      rescoreWithType: s.rescoreWithType,
    })),
  );

  if (!result) return null;

  const passedRules = result.ruleResults.filter((r) => r.passed).length;
  const totalRules = result.ruleResults.length;

  const scoreColor =
    result.overallScore >= 80
      ? 'var(--color-status-pass)'
      : result.overallScore >= 60
        ? 'var(--color-status-warn)'
        : 'var(--color-status-fail)';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
              Assessment Summary
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="px-3.5 py-1.5 corner-container-sm text-xs font-semibold text-brand-marine hover:text-brand-marine-hover bg-surface-panel hover:bg-surface-subtle border border-brand-marine/30 transition-all cursor-pointer active:scale-[0.98]"
          >
            Check another resume
          </button>
        </div>

        {/* Two-Pane Diagnostic Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Left Pane — Document & Visual Calibration Card */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div
              className="relative bg-surface-panel border border-border-subtle corner-container p-6 sm:p-7 shadow-xs overflow-hidden"
              style={{ aspectRatio: '8.5 / 11' }}
            >
              <div className="h-full flex flex-col justify-between">
                {/* File Identity */}
                {file && (
                  <div className="border-b border-border-subtle pb-4">
                    <h2 className="text-base font-bold text-ink-primary truncate">
                      {file.name}
                    </h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="tabular-data text-[11px] font-medium text-ink-secondary bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle/80">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <span className="tabular-data text-[11px] font-medium text-ink-secondary bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle/80">
                        {result.meta.pageCount} {result.meta.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                      <span className="tabular-data text-[11px] font-medium text-ink-secondary bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle/80">
                        {result.meta.wordCount.toLocaleString()} words
                      </span>
                    </div>
                  </div>
                )}

                {/* Score Focus Center */}
                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="score-reveal-moment text-center">
                    <div className="tabular-data text-7xl font-extrabold text-ink-primary tracking-tight leading-none">
                      {result.overallScore}
                    </div>
                    <div className="text-sm font-semibold text-ink-faint mt-1.5">
                      ATS Index Score
                    </div>
                  </div>

                  {/* Progress Gauge */}
                  <div className="mt-6 w-full max-w-[200px]">
                    <div className="h-2 bg-surface-subtle corner-container-sm overflow-hidden border border-border-subtle/50">
                      <div
                        className="h-full corner-child-clip transition-all duration-700 ease-out"
                        style={{
                          width: `${result.overallScore}%`,
                          backgroundColor: scoreColor,
                        }}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-ink-secondary tabular-data text-center">
                    {passedRules} of {totalRules} rules validated
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="pt-4 border-t border-border-subtle">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block">
                        Target Profile
                      </span>
                      <span className="font-semibold text-ink-primary uppercase truncate block mt-0.5">
                        {result.resumeType}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block">
                        Evaluation Level
                      </span>
                      <span className="font-semibold text-ink-primary block mt-0.5">
                        {result.experienceLevel === 'fresher' ? 'Fresher Rubric' : 'Experienced'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block">
                        Scan Duration
                      </span>
                      <span className="font-semibold text-ink-primary tabular-data block mt-0.5">
                        {result.meta.processingTimeMs}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block">
                        Check Token
                      </span>
                      <span className="font-semibold text-ink-faint block mt-0.5">
                        {result.checkId.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane — Complete Diagnostic Report & Guidance */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Score Band Primary Header */}
            <ScoreBandDisplay
              score={result.overallScore}
              band={result.band}
              bandLabel={result.bandLabel}
              resumeType={result.resumeType}
            />

            {/* Fresher Evaluation Notice */}
            {result.experienceLevel === 'fresher' && (
              <div className="p-4 corner-container-md bg-status-pass-subtle border border-status-pass/20 text-xs text-status-pass leading-relaxed">
                <strong>Fresher Assessment Framework Applied:</strong> Tenured employment requirements adjusted. Academic projects, hackathons, and technical coursework evaluated for core capability.
              </div>
            )}

            {/* Target Profile Suggestion */}
            {result.profileSuggestion && (
              <div className="p-4 corner-container-md bg-status-warn-subtle/80 border border-status-warn/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-status-warn">
                      Alternative Profile Suggestion
                    </h3>
                    <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                      {result.profileSuggestion.reason}
                    </p>
                  </div>
                  {file && (
                    <button
                      type="button"
                      onClick={() => rescoreWithType(result.profileSuggestion!.typeId)}
                      className="shrink-0 px-3.5 py-1.5 corner-container-sm bg-status-warn text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Re-score as {result.profileSuggestion.label}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Non-English Resume Warning */}
            {result.isNonEnglish && (
              <div className="p-4 corner-container-md bg-status-warn-subtle border border-status-warn/40">
                <h3 className="text-xs font-bold uppercase tracking-wide text-status-warn">
                  Non-English Document Content Detected
                </h3>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  {result.warnings?.find((w) => w.includes('non-English') || w.includes('calibrated')) ||
                    'ResumePro scoring rubrics and keyword taxonomies are calibrated for English-language documents. Scores may reflect parsing gaps rather than true qualification.'}
                </p>
              </div>
            )}

            {/* Multi-Resume Merge Anomaly Warning */}
            {result.isMultiResumeAnomaly && (
              <div className="p-4 corner-container-md bg-status-fail-subtle border border-status-fail/30">
                <h3 className="text-xs font-bold uppercase tracking-wide text-status-fail">
                  Merged Document Anomaly Detected
                </h3>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  {result.warnings?.find((w) => w.includes('multi-resume')) ||
                    'Repeated section structures and oversized content detected. Please submit individual single-candidate resumes to avoid ATS screening disorientation.'}
                </p>
              </div>
            )}

            {/* Detailed Category Diagnostic Report */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-ink-primary tracking-tight">
                  Rule Diagnostics
                </h2>
                <span className="text-xs text-ink-faint tabular-data">
                  {result.categories.length} categories · {totalRules} checks
                </span>
              </div>

              <div className="bg-surface-panel border border-border-subtle corner-container px-5 sm:px-6 shadow-xs">
                {result.categories.map((cat) => (
                  <CategorySection key={cat.name} category={cat} />
                ))}
              </div>
            </div>

            {/* AI Insights & Recommendations */}
            <AiInsightsSection aiInsights={result.aiInsights} />

            {/* Bottom Secondary Action */}
            <div className="pt-6 pb-2 text-center">
              <button
                type="button"
                onClick={reset}
                className="px-6 py-2.5 corner-container-sm text-sm font-semibold text-brand-marine hover:text-brand-marine-hover bg-surface-panel hover:bg-surface-subtle border border-brand-marine/30 transition-all cursor-pointer active:scale-[0.98]"
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
