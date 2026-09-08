import { create } from 'zustand';
import type {
  CheckPhase,
  CompletedStep,
  ScoreBreakdown,
  UsageStatus,
} from '../types/scoring.types';
import { initiateCheck, streamCheckProgress, fetchUsageStatus } from '../api/resume-api';

// ─── State Shape ───────────────────────────────────────────────

interface CheckState {
  /** Current phase of the check flow. */
  phase: CheckPhase;

  /** Selected resume file. */
  file: File | null;

  /** Selected resume type ('' = auto-detect). */
  resumeType: string;

  /** Experience level toggle ('experienced' or 'fresher'). */
  experienceLevel: 'experienced' | 'fresher';

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

  /** Current usage and limit status. */
  usageStatus: UsageStatus | null;

  /** Cleanup function for the SSE stream. */
  _streamCleanup: (() => void) | null;
}

interface CheckActions {
  /** Set the selected file. */
  setFile: (file: File | null) => void;

  /** Set the selected resume type. */
  setResumeType: (type: string) => void;

  /** Set experience level ('experienced' or 'fresher'). */
  setExperienceLevel: (level: 'experienced' | 'fresher') => void;

  /** Rescore the currently selected resume with a new profile type. */
  rescoreWithType: (newType: string) => Promise<void>;

  /** Refresh the user's check limits and usage status. */
  fetchUsage: (token?: string | null) => Promise<void>;

  /** Manually update the usage status. */
  setUsageStatus: (status: UsageStatus | null) => void;

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
  experienceLevel: 'experienced',
  checkId: null,
  completedSteps: [],
  currentStep: null,
  result: null,
  error: null,
  usageStatus: null,
  _streamCleanup: null,
};

// ─── Store ─────────────────────────────────────────────────────

export const useCheckStore = create<CheckStore>()((set, get) => ({
  ...initialState,

  setFile: (file) => set({ file, error: null }),

  setResumeType: (resumeType) => set({ resumeType }),

  setExperienceLevel: (experienceLevel) => set({ experienceLevel }),

  rescoreWithType: async (newType: string) => {
    set({ resumeType: newType });
    await get().startCheck();
  },

  setUsageStatus: (usageStatus) => set({ usageStatus }),

  fetchUsage: async (token?: string | null) => {
    try {
      const activeToken = token ?? localStorage.getItem('resumepro_token');
      const usageStatus = await fetchUsageStatus(activeToken);
      set({ usageStatus });
    } catch {
      // Usage fetch failure is non-blocking
    }
  },

  startCheck: async () => {
    const { file, resumeType, experienceLevel, _streamCleanup, usageStatus } = get();

    // Check availability client-side if usage status is known
    if (usageStatus && !usageStatus.allowed) {
      set({
        error: "You've reached your daily limit of 5 checks. Please log in or come back tomorrow!",
        phase: 'error',
      });
      return;
    }

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

    const token = localStorage.getItem('resumepro_token');

    try {
      // POST /resume/check → { checkId }
      const { checkId } = await initiateCheck(file, resumeType, token, experienceLevel);

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
          // Refresh usage counter immediately
          get().fetchUsage(token);
        },

        onError: (message) => {
          set({
            phase: 'error',
            error: message,
            currentStep: null,
            _streamCleanup: null,
          });
          get().fetchUsage(token);
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
      get().fetchUsage(token);
    }
  },

  reset: () => {
    const { _streamCleanup, usageStatus } = get();
    if (_streamCleanup) {
      _streamCleanup();
    }
    set({ ...initialState, usageStatus });
  },
}));

// ─── Granular Selectors ────────────────────────────────────────

export const selectPhase = (state: CheckStore) => state.phase;
export const selectFile = (state: CheckStore) => state.file;
export const selectResumeType = (state: CheckStore) => state.resumeType;
export const selectExperienceLevel = (state: CheckStore) => state.experienceLevel;
export const selectCompletedSteps = (state: CheckStore) => state.completedSteps;
export const selectCurrentStep = (state: CheckStore) => state.currentStep;
export const selectResult = (state: CheckStore) => state.result;
export const selectError = (state: CheckStore) => state.error;
export const selectUsageStatus = (state: CheckStore) => state.usageStatus;
export const selectActions = (state: CheckStore) => ({
  setFile: state.setFile,
  setResumeType: state.setResumeType,
  setExperienceLevel: state.setExperienceLevel,
  rescoreWithType: state.rescoreWithType,
  startCheck: state.startCheck,
  fetchUsage: state.fetchUsage,
  setUsageStatus: state.setUsageStatus,
  reset: state.reset,
});
