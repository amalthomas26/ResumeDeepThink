import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import type { ScoreBand } from '../types/scoring.types';

export const HistoryView: React.FC = () => {
  const isHistoryOpen = useAuthStore((s) => s.isHistoryOpen);
  const closeHistory = useAuthStore((s) => s.closeHistory);
  const history = useAuthStore((s) => s.history);
  const isLoadingHistory = useAuthStore((s) => s.isLoadingHistory);
  const loadHistory = useAuthStore((s) => s.loadHistory);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isHistoryOpen) {
      loadHistory();
    }
  }, [isHistoryOpen, loadHistory]);

  if (!isHistoryOpen) return null;

  const getBandBadge = (band: ScoreBand, label: string) => {
    switch (band) {
      case 'strong':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-medium bg-[#E8F5EE] text-[#2C6B4F] border border-[#BDE3CF]">
            {label}
          </span>
        );
      case 'workable':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-medium bg-[#FFF8E7] text-[#B87A1E] border border-[#F7E2B0]">
            {label}
          </span>
        );
      case 'at-risk':
      case 'high-risk':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-medium bg-[#FCEAE5] text-[#C1573B] border border-[#F6C5B8]">
            {label}
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16213D]/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeHistory}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-[#D8DDE3] shadow-2xl p-8 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-[#D8DDE3]">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#2C6B4F] font-semibold">
              Scan History
            </span>
            <h2 className="text-2xl font-serif text-[#16213D] font-normal mt-0.5">
              Previous Resume Checks
            </h2>
            {user && (
              <p className="text-xs font-mono text-[#8A94A6] mt-1">
                Account: <span className="text-[#4A5568]">{user.email}</span>
              </p>
            )}
          </div>
          <button
            onClick={closeHistory}
            className="text-[#8A94A6] hover:text-[#16213D] text-2xl font-mono leading-none transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto flex-1 py-4 divide-y divide-[#EEF1F3]">
          {isLoadingHistory ? (
            <div className="py-12 text-center text-sm font-mono text-[#8A94A6]">
              Loading scan records…
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-serif text-[#4A5568] text-base">
                No scan records found for this account.
              </p>
              <p className="text-xs font-mono text-[#8A94A6] mt-1">
                Upload and scan a resume to automatically track your score progress here.
              </p>
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#EEF1F3]/30 px-2 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-[#16213D] truncate">
                      {entry.fileName || 'Resume Document'}
                    </span>
                    <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 bg-[#EEF1F3] text-[#4A5568]">
                      {entry.resumeType || 'General'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#8A94A6] mt-1">
                    {formatDate(entry.createdAt)}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-lg font-semibold text-[#16213D]">
                      {entry.overallScore}
                      <span className="text-xs font-normal text-[#8A94A6]">/100</span>
                    </div>
                  </div>
                  <div>{getBandBadge(entry.band, entry.bandLabel)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#D8DDE3] flex items-center justify-between text-xs font-mono text-[#8A94A6]">
          <span>Showing last {history.length} checks</span>
          <button
            onClick={closeHistory}
            className="px-4 py-1.5 border border-[#D8DDE3] text-[#16213D] hover:bg-[#EEF1F3] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
