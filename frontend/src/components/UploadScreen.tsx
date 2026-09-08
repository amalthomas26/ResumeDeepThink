import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import {
  useCheckStore,
  selectFile,
  selectResumeType,
  selectExperienceLevel,
  selectError,
  selectPhase,
  selectUsageStatus,
} from '../store/check-store';
import { useAuthStore } from '../store/auth-store';
import { useShallow } from 'zustand/react/shallow';

/**
 * UploadScreen — Monolithic Diagnostic Intake Panel.
 * Designed for precise, calm authority without generic SaaS tropes.
 */
export function UploadScreen() {
  const file = useCheckStore(selectFile);
  const resumeType = useCheckStore(selectResumeType);
  const experienceLevel = useCheckStore(selectExperienceLevel);
  const error = useCheckStore(selectError);
  const phase = useCheckStore(selectPhase);
  const usageStatus = useCheckStore(selectUsageStatus);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const { setFile, setResumeType, setExperienceLevel, startCheck } = useCheckStore(
    useShallow((s) => ({
      setFile: s.setFile,
      setResumeType: s.setResumeType,
      setExperienceLevel: s.setExperienceLevel,
      startCheck: s.startCheck,
    })),
  );

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = phase === 'uploading';
  const isLimitReached = Boolean(usageStatus && !usageStatus.allowed);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        setFile(droppedFile);
      }
    },
    [setFile],
  );

  const handleFileSelect = useCallback(() => {
    const input = fileInputRef.current;
    if (input?.files?.[0]) {
      setFile(input.files[0]);
    }
  }, [setFile]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!file || isUploading || isLimitReached) return;
      startCheck();
    },
    [file, isUploading, isLimitReached, startCheck],
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl">
        {/* Diagnostic Intake Monolith */}
        <div className="bg-surface-panel border border-border-subtle corner-container p-6 sm:p-8 shadow-xs">
          {/* Header & Purpose Statement */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">
              ATS Compatibility Assessment
            </h1>
            <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">
              Verify parsing integrity, keyword coverage, and section structure against modern applicant tracking systems.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Accessible Drag-and-Drop Area */}
            <div>
              <label
                htmlFor="file-upload"
                className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2"
              >
                Resume Document
              </label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-label="Upload resume file in PDF or DOCX format"
                aria-disabled={isUploading}
                className={`
                  relative cursor-pointer corner-container-md border-2 border-dashed
                  transition-all duration-150 p-6 sm:p-8 text-center
                  ${isDragging
                    ? 'border-brand-marine bg-brand-marine/5'
                    : file
                      ? 'border-brand-marine/40 bg-surface-subtle'
                      : 'border-border-subtle hover:border-border-strong bg-surface-subtle/40 hover:bg-surface-subtle'
                  }
                  ${isUploading ? 'pointer-events-none opacity-60' : ''}
                  active:scale-[0.995]
                `}
              >
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                  className="sr-only"
                  disabled={isUploading}
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-status-pass-subtle text-status-pass flex items-center justify-center font-bold text-base">
                      ✓
                    </div>
                    <div className="font-semibold text-base text-ink-primary truncate max-w-sm mx-auto">
                      {file.name}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-ink-faint">
                      <span className="tabular-data font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                      <span>·</span>
                      <span>{file.name.endsWith('.docx') ? 'DOCX document' : 'PDF document'}</span>
                    </div>
                    <p className="text-xs text-brand-marine font-semibold pt-1">
                      Click or drop another file to replace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-surface-panel border border-border-subtle flex items-center justify-center text-ink-faint">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-ink-primary">
                      Drop your resume here or click to browse
                    </p>
                    <p className="text-xs text-ink-faint">
                      Accepts PDF and DOCX documents up to 5MB
                    </p>
                    <div className="pt-1">
                      <span className="inline-block text-[11px] font-medium text-ink-secondary bg-surface-panel px-2.5 py-0.5 rounded-full border border-border-subtle">
                        Calibrated for English language resumes
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Experience Level Segmented Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2">
                Evaluation Baseline
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-subtle corner-container-md border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setExperienceLevel('experienced')}
                  disabled={isUploading}
                  className={`py-2 px-3 corner-container-sm text-sm font-semibold transition-all cursor-pointer ${
                    experienceLevel === 'experienced'
                      ? 'bg-surface-panel text-ink-primary shadow-xs border border-border-subtle'
                      : 'text-ink-secondary hover:text-ink-primary active:scale-[0.98]'
                  }`}
                >
                  Experienced
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExperienceLevel('fresher');
                    if (!resumeType) setResumeType('fresher');
                  }}
                  disabled={isUploading}
                  className={`py-2 px-3 corner-container-sm text-sm font-semibold transition-all cursor-pointer ${
                    experienceLevel === 'fresher'
                      ? 'bg-brand-marine text-white shadow-xs'
                      : 'text-ink-secondary hover:text-ink-primary active:scale-[0.98]'
                  }`}
                >
                  Fresher / Graduate
                </button>
              </div>

              {experienceLevel === 'fresher' && (
                <p className="text-xs text-status-pass mt-2 leading-relaxed bg-status-pass-subtle/50 p-2.5 rounded-md border border-status-pass/20">
                  Fresher mode active: Academic projects, coursework, and internships satisfy experience criteria without tenure penalties.
                </p>
              )}
            </div>

            {/* Target Job Profile Selector */}
            <div>
              <label
                htmlFor="target-profile"
                className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2"
              >
                Target Profile (Keyword Calibration)
              </label>
              <select
                id="target-profile"
                value={resumeType}
                onChange={(e) => setResumeType(e.target.value)}
                disabled={isUploading}
                className="w-full px-3.5 py-2.5 corner-container-md border border-border-subtle bg-surface-panel text-sm text-ink-primary font-medium hover:border-border-strong focus-visible:border-brand-marine transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">Auto-detect profile from keyword density</option>
                <option value="tech">Technology / Software Engineering</option>
                <option value="fresher">Fresher / Early Career / Campus Graduate</option>
                <option value="finance">Finance / Accounting / Banking</option>
                <option value="marketing">Marketing / Growth / Brand</option>
                <option value="creative">Creative / Design / UI-UX</option>
                <option value="support">Customer Support / Operations</option>
                <option value="general">General Professional</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 corner-container-md bg-status-fail-subtle border border-status-fail/20 text-xs font-semibold text-status-fail">
                {error}
              </div>
            )}

            {/* Daily Limit Notice */}
            {isLimitReached && (
              <div className="p-4 corner-container-md bg-status-warn-subtle/70 border border-status-warn/30">
                <div className="flex items-center gap-2 text-status-warn text-xs font-bold uppercase tracking-wide mb-1">
                  Daily Check Limit Reached
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  You have completed all 5 free daily evaluations. Quotas reset automatically at midnight UTC.
                </p>
                {!user && (
                  <div className="mt-3 pt-2.5 border-t border-status-warn/20 flex items-center justify-between">
                    <span className="text-xs text-ink-secondary">Retain your scan history?</span>
                    <button
                      type="button"
                      onClick={() => openAuthModal()}
                      className="text-xs font-bold text-brand-marine hover:underline cursor-pointer"
                    >
                      Sign in with email
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Button — Fully Styled Across All 6 Interaction States */}
            <button
              type="submit"
              disabled={!file || isUploading || isLimitReached}
              aria-busy={isUploading}
              className={`
                w-full py-3.5 px-6 corner-container-md text-sm font-bold tracking-tight text-white
                transition-all duration-150 cursor-pointer
                ${isUploading
                  ? 'bg-brand-marine/80 cursor-wait'
                  : !file || isLimitReached
                    ? 'bg-surface-subtle text-ink-faint border border-border-subtle cursor-not-allowed shadow-none'
                    : 'bg-brand-marine hover:bg-brand-marine-hover active:bg-brand-marine-active active:scale-[0.99] shadow-xs'
                }
              `}
            >
              {isUploading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Evaluating document…
                </span>
              ) : isLimitReached ? (
                'Daily check limit reached (5 of 5)'
              ) : (
                'Score Resume'
              )}
            </button>

            {/* Reassuring Footer Context */}
            <div className="text-center">
              <span className="text-xs text-ink-faint tabular-data">
                {usageStatus
                  ? `${usageStatus.remaining} of ${usageStatus.limit} free checks remaining today`
                  : '5 free checks daily · No account required'}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
