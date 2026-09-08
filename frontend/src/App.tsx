import { useCheckStore, selectPhase, selectError } from './store/check-store';
import { useShallow } from 'zustand/react/shallow';
import { UploadScreen } from './components/UploadScreen';
import { ScanningScreen } from './components/ScanningScreen';
import { ResultsScreen } from './components/ResultsScreen';

/**
 * App — phase-based routing from Zustand store.
 * No local state; everything lives in the store.
 *
 * Per roadmap Phase 2: "Zustand store for check state
 * (idle → uploading → scanning → results)."
 */
export default function App() {
  const phase = useCheckStore(selectPhase);
  const error = useCheckStore(selectError);
  const reset = useCheckStore(useShallow((s) => s.reset));

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
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-rust-light flex items-center justify-center">
              <span className="text-rust text-2xl">!</span>
            </div>
            <h1 className="font-serif text-xl font-bold text-ink mb-3">
              Something went wrong
            </h1>
            <p className="font-serif text-sm text-ink-muted mb-6 leading-relaxed">
              {error ?? 'An unexpected error occurred.'}
            </p>
            <button
              type="button"
              onClick={reset}
              className="font-serif text-sm font-bold text-paper bg-pine hover:bg-pine/90
                         px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      );

    default:
      return <UploadScreen />;
  }
}
