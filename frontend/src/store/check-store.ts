import { create } from 'zustand';
import type {
  CheckPhase,
  CompletedStep,
  ScoreBreakdown,
} from '../types/scoring.types';
import { initiateCheck, streamCheckProgress } from '../api/resume-api';

// ─── State Shape ───────────────────────────────────────────────

interface CheckState {
  /** Current phase of the check flow. */
  phase: CheckPhase;

  /** Selected resume file. */
  file: File | null;

  /** Selected resume type ('' = auto-detect). */
  resumeType: string;

  /** Check ID returned from the server. */
  checkId: string | null;

  /** Steps completed during scanning (for the checklist animation). */
  completedSteps: CompletedStep[];

  /** The rule currently being checked (label for the scanning screen). */
  currentStep: string | null;

  /** The final score breakdown. */
  result: ScoreBreakdown | null;

  /** Error message, if any. */
  error: string | null;

  /** Cleanup function for the SSE stream. */
  _streamCleanup: (() => void) | null;
}

interface CheckActions {
  /** Set the selected file. */
  setFile: (file: File | null) => void;

  /** Set the selected resume type. */
  setResumeType: (type: string) => void;

  /** Initiate the full check flow: upload → stream → results. */
  startCheck: () => Promise<void>;

  /** Reset to idle state. */
  reset: () => void;
}

export type CheckStore = CheckState & CheckActions;

// ─── Initial State ─────────────────────────────────────────────

const initialState: CheckState = {
  phase: 'idle',
  file: null,
  resumeType: '',
  checkId: null,
  completedSteps: [],
  currentStep: null,
  result: null,
  error: null,
  _streamCleanup: null,
};

// ─── Store ─────────────────────────────────────────────────────

export const useCheckStore = create<CheckStore>()((set, get) => ({
  ...initialState,

  setFile: (file) => set({ file, error: null }),

  setResumeType: (resumeType) => set({ resumeType }),

  startCheck: async () => {
    const { file, resumeType, _streamCleanup } = get();

    // Cleanup any existing stream
    if (_streamCleanup) {
      _streamCleanup();
    }

    if (!file) {
      set({ error: 'Please select a PDF or DOCX file to analyze.', phase: 'error' });
      return;
    }

    // Transition: idle → uploading
    set({
      phase: 'uploading',
      error: null,
      result: null,
      completedSteps: [],
      currentStep: null,
      checkId: null,
    });

    try {
      // POST /resume/check → { checkId }
      const { checkId } = await initiateCheck(file, resumeType);

      // Transition: uploading → scanning
      set({ phase: 'scanning', checkId });

      // Open SSE stream
      const cleanup = streamCheckProgress(checkId, {
        onStepStart: (event) => {
          set({ currentStep: event.label });
        },

        onStepComplete: (event) => {
          set((state) => ({
            completedSteps: [
              ...state.completedSteps,
              {
                ruleId: event.ruleId,
                category: event.category,
                label: event.label,
                severity: event.severity,
              },
            ],
          }));
        },

        onComplete: (result) => {
          set({
            phase: 'results',
            result,
            currentStep: null,
            _streamCleanup: null,
          });
        },

        onError: (message) => {
          set({
            phase: 'error',
            error: message,
            currentStep: null,
            _streamCleanup: null,
          });
        },
      });

      set({ _streamCleanup: cleanup });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while connecting to the scoring API.';
      set({
        phase: 'error',
        error: message,
        _streamCleanup: null,
      });
    }
  },

  reset: () => {
    const { _streamCleanup } = get();
    if (_streamCleanup) {
      _streamCleanup();
    }
    set({ ...initialState });
  },
}));

// ─── Granular Selectors ────────────────────────────────────────
// Per requirements: use selectors for excellent modularity.
// Each component picks only the slice it needs, preventing unnecessary re-renders.

export const selectPhase = (state: CheckStore) => state.phase;
export const selectFile = (state: CheckStore) => state.file;
export const selectResumeType = (state: CheckStore) => state.resumeType;
export const selectCompletedSteps = (state: CheckStore) => state.completedSteps;
export const selectCurrentStep = (state: CheckStore) => state.currentStep;
export const selectResult = (state: CheckStore) => state.result;
export const selectError = (state: CheckStore) => state.error;
export const selectActions = (state: CheckStore) => ({
  setFile: state.setFile,
  setResumeType: state.setResumeType,
  startCheck: state.startCheck,
  reset: state.reset,
});
