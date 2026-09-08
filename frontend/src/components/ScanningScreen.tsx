import { useCheckStore, selectCompletedSteps, selectCurrentStep, selectFile } from '../store/check-store';
import { ChecklistItem } from './ChecklistItem';

/**
 * Scanning screen — two-pane layout.
 * Left: blank/skeleton paper with scan-line sweep animation.
 * Right: checklist items resolve one by one in real time as SSE events arrive.
 *
 * Per design-and-wireframe.md: "scan-line sweep on the left, checklist items
 * resolve one at a time in the right pane in real time."
 */
export function ScanningScreen() {
  const completedSteps = useCheckStore(selectCompletedSteps);
  const currentStep = useCheckStore(selectCurrentStep);
  const file = useCheckStore(selectFile);

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Minimal branding */}
        <div className="mb-8">
          <span className="font-mono text-xs font-semibold text-ink-faint uppercase tracking-widest">
            ResumePro
          </span>
        </div>

        {/* Two-pane layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Left pane — paper preview skeleton with scan line */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div
              className="relative bg-paper rounded-sm overflow-hidden"
              style={{
                aspectRatio: '8.5 / 11',
                boxShadow: '0 4px 20px rgba(22, 33, 61, 0.08)',
              }}
            >
              {/* Scan line sweep */}
              <div className="scan-line-sweep absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-pine/30 to-transparent" />

              {/* Skeleton content lines */}
              <div className="p-8 space-y-4">
                {/* Name placeholder */}
                <div className="h-5 bg-canvas rounded w-2/5" />
                {/* Contact info placeholder */}
                <div className="flex gap-3 mt-1">
                  <div className="h-3 bg-canvas rounded w-28" />
                  <div className="h-3 bg-canvas rounded w-24" />
                </div>
                {/* Divider */}
                <div className="h-px bg-border-light mt-4" />
                {/* Section header */}
                <div className="h-4 bg-canvas rounded w-1/3 mt-6" />
                {/* Content lines */}
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={`line-a-${i}`} className="h-3 bg-canvas rounded" style={{ width: `${80 - i * 5}%` }} />
                ))}
                {/* Another section */}
                <div className="h-4 bg-canvas rounded w-1/4 mt-5" />
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={`line-b-${i}`} className="h-3 bg-canvas rounded" style={{ width: `${75 - i * 8}%` }} />
                ))}
                {/* Skills section */}
                <div className="h-4 bg-canvas rounded w-1/5 mt-5" />
                <div className="flex flex-wrap gap-2 mt-1">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={`skill-${i}`} className="h-5 bg-canvas rounded-full" style={{ width: `${50 + i * 6}px` }} />
                  ))}
                </div>
              </div>

              {/* File info overlay at bottom */}
              {file && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-paper via-paper/90 to-transparent p-4 pt-8">
                  <p className="font-mono text-xs text-ink-faint truncate">{file.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right pane — live checklist */}
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl font-bold text-ink mb-1">
              Analyzing your resume…
            </h2>
            <p className="font-serif text-sm text-ink-faint mb-6">
              Running {completedSteps.length > 0 ? completedSteps.length : '–'} of ~18 ATS compatibility checks
            </p>

            {/* Current step indicator */}
            {currentStep && (
              <div className="flex items-center gap-3 mb-4 py-2 px-3 bg-canvas rounded-lg">
                {/* Spinning dot */}
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pine opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pine" />
                </span>
                <span className="font-serif text-sm text-ink-muted">{currentStep}</span>
              </div>
            )}

            {/* Completed steps checklist */}
            <div className="divide-y divide-border-light">
              {completedSteps.map((step, i) => (
                <ChecklistItem key={step.ruleId} step={step} index={i} />
              ))}
            </div>

            {completedSteps.length === 0 && !currentStep && (
              <div className="py-12 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-canvas rounded w-48 mx-auto mb-3" />
                  <div className="h-3 bg-canvas rounded w-32 mx-auto" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
