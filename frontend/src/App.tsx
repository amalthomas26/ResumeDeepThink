import { useEffect, useState } from 'react';
import {
  useCheckStore,
  selectPhase,
  selectError,
  selectUsageStatus,
} from './store/check-store';
import { useAuthStore } from './store/auth-store';
import { useShallow } from 'zustand/react/shallow';
import { UploadScreen } from './components/UploadScreen';
import { ScanningScreen } from './components/ScanningScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { LoginModal } from './components/LoginModal';
import { HistoryView } from './components/HistoryView';
import { GuidesView } from './components/GuidesView';

export default function App() {
  const phase = useCheckStore(selectPhase);
  const error = useCheckStore(selectError);
  const usageStatus = useCheckStore(selectUsageStatus);
  const reset = useCheckStore(useShallow((s) => s.reset));
  const fetchUsage = useCheckStore((s) => s.fetchUsage);
  const setUsageStatus = useCheckStore((s) => s.setUsageStatus);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openHistory = useAuthStore((s) => s.openHistory);
  const initSession = useAuthStore((s) => s.initSession);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showGuides, setShowGuides] = useState(false);

  // Initialize session and fetch usage limits on app load
  useEffect(() => {
    initSession((usage) => {
      if (usage) setUsageStatus(usage);
    });
    fetchUsage();
  }, [initSession, fetchUsage, setUsageStatus]);

  const handleReset = () => {
    setShowGuides(false);
    reset();
  };

  const renderContent = () => {
    if (showGuides) {
      return <GuidesView onClose={() => setShowGuides(false)} />;
    }

    switch (phase) {
      case 'idle':
      case 'uploading':
        return <UploadScreen />;

      case 'scanning':
        return <ScanningScreen />;

      case 'results':
        return <ResultsScreen />;

      case 'error':
        return (
          <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center bg-surface-panel p-8 border border-border-subtle corner-container shadow-xs">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-status-fail-subtle flex items-center justify-center text-status-fail font-bold text-xl">
                !
              </div>
              <h1 className="text-xl font-bold text-ink-primary mb-2">
                Processing Error
              </h1>
              <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
                {error ?? 'An unexpected error occurred during resume evaluation.'}
              </p>
              <button
                type="button"
                onClick={reset}
                className="w-full py-2.5 px-4 bg-brand-marine hover:bg-brand-marine-hover active:bg-brand-marine-active text-white text-sm font-semibold rounded-md transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        );

      default:
        return <UploadScreen />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-base text-ink-primary relative overflow-x-hidden">
      {/* Ambient Animated Background (Compositor Thread Only) */}
      <div className="ambient-bg-container" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      {/* Global Header */}
      <header className="w-full bg-surface-panel/90 backdrop-blur-md border-b border-border-subtle sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none"
              aria-label="ResumeDeepThink home"
            >
              <div className="w-6 h-6 rounded-md bg-brand-marine flex items-center justify-center text-white text-xs font-bold tracking-tight">
                RD
              </div>
              <span className="text-base font-bold text-ink-primary tracking-tight group-hover:text-brand-marine transition-colors">
                ResumeDeepThink
              </span>
            </button>
            <span className="hidden sm:inline text-xs text-ink-faint font-medium border-l border-border-subtle pl-3">
              ATS Diagnostics
            </span>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ATS Guides Button */}
            <button
              type="button"
              onClick={() => setShowGuides((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                showGuides
                  ? 'bg-brand-marine text-white border-brand-marine'
                  : 'bg-surface-panel text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle border-border-subtle active:scale-[0.98]'
              }`}
            >
              ATS Guides
            </button>

            {/* Daily Usage Counter */}
            {usageStatus && (
              <div
                className={`hidden md:flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-full ${
                  usageStatus.remaining > 0
                    ? 'bg-status-pass-subtle text-status-pass border-status-pass/20'
                    : 'bg-status-fail-subtle text-status-fail border-status-fail/20'
                }`}
                title={`${usageStatus.used} checks used out of ${usageStatus.limit} today (resets midnight UTC)`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="tabular-data">
                  {usageStatus.remaining} of {usageStatus.limit} free checks left
                </span>
              </div>
            )}

            {/* Support Project Button */}
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-ink-secondary bg-surface-subtle hover:bg-border-subtle border border-border-subtle transition-all rounded-md cursor-pointer active:scale-[0.98]"
            >
              Support project
            </button>

            {/* Auth / Account Controls */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openHistory}
                  className="px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink-primary bg-surface-panel hover:bg-surface-subtle border border-border-subtle rounded-md transition-all cursor-pointer active:scale-[0.98]"
                >
                  History
                </button>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs text-ink-faint max-w-[120px] truncate hidden md:inline"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs text-ink-faint hover:text-status-fail transition-colors cursor-pointer"
                    title="Sign out"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="px-3.5 py-1.5 text-xs font-semibold text-brand-marine hover:text-brand-marine-hover bg-surface-panel hover:bg-surface-subtle border border-brand-marine/30 rounded-md transition-all cursor-pointer active:scale-[0.98]"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Support Project Modal */}
      {showSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/40 backdrop-blur-xs"
          onClick={() => setShowSupportModal(false)}
        >
          <div
            className="bg-surface-panel border border-border-subtle corner-container p-6 max-w-sm w-full relative shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-ink-primary mb-2">
              Support ResumeDeepThink
            </h3>
            <p className="text-sm text-ink-secondary leading-relaxed mb-5">
              ResumeDeepThink is built to deliver transparent, unbiased ATS diagnostic tools for job seekers. Contributions support continuous server infrastructure and scoring calibration.
            </p>
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 bg-brand-marine hover:bg-brand-marine-hover active:bg-brand-marine-active text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              Close notice
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">{renderContent()}</main>

      {/* Modals & Drawers */}
      <LoginModal />
      <HistoryView />
    </div>
  );
}
