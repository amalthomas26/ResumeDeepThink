import { useCheckStore, selectCompletedSteps, selectCurrentStep, selectFile } from '../store/check-store';
import { ChecklistItem } from './ChecklistItem';

/**
 * ScanningScreen — Real-time ATS Evaluation Progress.
 * Dual-pane diagnostic observation layout with compositor-safe scan sweep.
 */
export function ScanningScreen() {
  const completedSteps = useCheckStore(selectCompletedSteps);
  const currentStep = useCheckStore(selectCurrentStep);
  const file = useCheckStore(selectFile);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        {/* Screen Heading */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">
            Analyzing ATS Compatibility
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Evaluating structural parseability, keyword match density, and recruiter formatting heuristics.
          </p>
        </div>

        {/* Two-Pane Diagnostic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: Document Abstract Skeleton Preview */}
          <div className="lg:col-span-5 w-full">
            <div
              className="relative bg-surface-panel border border-border-subtle corner-container overflow-hidden"
              style={{ aspectRatio: '8.5 / 11' }}
            >
              {/* Scan-Line Sweep (GPU Transform Only) */}
              <div
                className="absolute inset-x-0 h-1 bg-brand-marine/40 shadow-xs"
                style={{
                  animation: 'ambient-drift-1 4s ease-in-out infinite alternate',
                  willChange: 'transform',
                }}
              />

              {/* Document Skeleton Lines */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="h-5 bg-surface-subtle rounded-sm w-1/2" />
                <div className="flex gap-2 mt-1">
                  <div className="h-3 bg-surface-subtle rounded-sm w-24" />
                  <div className="h-3 bg-surface-subtle rounded-sm w-28" />
                </div>
                <div className="h-px bg-border-subtle mt-4" />
                <div className="h-4 bg-surface-subtle rounded-sm w-1/3 mt-6" />
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={`line-a-${i}`}
                    className="h-2.5 bg-surface-subtle rounded-sm"
                    style={{ width: `${85 - i * 6}%` }}
                  />
                ))}
                <div className="h-4 bg-surface-subtle rounded-sm w-1/4 mt-5" />
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={`line-b-${i}`}
                    className="h-2.5 bg-surface-subtle rounded-sm"
                    style={{ width: `${75 - i * 8}%` }}
                  />
                ))}
              </div>

              {/* Active Document Tag Overlay */}
              {file && (
                <div className="absolute bottom-0 inset-x-0 bg-surface-panel/95 border-t border-border-subtle p-3.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-primary truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-ink-faint tabular-data">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Checklist Diagnostics */}
          <div className="lg:col-span-7 w-full bg-surface-panel border border-border-subtle corner-container p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
              <h2 className="text-base font-bold text-ink-primary">
                Rule Check Pipeline
              </h2>
              <span className="text-xs font-semibold text-brand-marine tabular-data bg-brand-marine/10 px-2.5 py-1 rounded-full">
                {completedSteps.length} of 18 completed
              </span>
            </div>

            {/* Current Active Rule Step */}
            {currentStep && (
              <div
                className="flex items-center gap-3 p-3 bg-surface-subtle corner-container-sm mb-4 border border-border-subtle"
                aria-live="polite"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-brand-marine animate-ping shrink-0" />
                <span className="text-sm font-semibold text-ink-primary">
                  {currentStep}
                </span>
              </div>
            )}

            {/* Completed Steps Stream */}
            <div className="space-y-0.5">
              {completedSteps.map((step, i) => (
                <ChecklistItem key={step.ruleId} step={step} index={i} />
              ))}
            </div>

            {completedSteps.length === 0 && !currentStep && (
              <div className="py-12 text-center text-xs text-ink-faint">
                Initializing ATS parsing pipeline…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
