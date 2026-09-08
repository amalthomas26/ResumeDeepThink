import { create } from 'zustand';
import type { User, CheckHistoryEntry, UsageStatus } from '../types/scoring.types';
import { sendOtp, verifyOtp, fetchMe, fetchHistory } from '../api/auth-api';

const TOKEN_KEY = 'resumepro_token';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthModalOpen: boolean;
  isHistoryOpen: boolean;
  history: CheckHistoryEntry[];
  isLoadingHistory: boolean;
  isLoadingAuth: boolean;
  authError: string | null;
  otpSent: boolean;
  targetEmail: string;
}

interface AuthActions {
  openAuthModal: (email?: string) => void;
  closeAuthModal: () => void;
  openHistory: () => void;
  closeHistory: () => void;
  requestOtp: (email: string) => Promise<boolean>;
  confirmOtp: (
    code: string,
    onSuccess?: (usage?: UsageStatus) => void,
  ) => Promise<boolean>;
  logout: () => void;
  initSession: (onSessionLoaded?: (usage: UsageStatus) => void) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isAuthModalOpen: false,
  isHistoryOpen: false,
  history: [],
  isLoadingHistory: false,
  isLoadingAuth: false,
  authError: null,
  otpSent: false,
  targetEmail: '',

  openAuthModal: (email = '') =>
    set({
      isAuthModalOpen: true,
      authError: null,
      otpSent: false,
      targetEmail: email,
    }),

  closeAuthModal: () =>
    set({
      isAuthModalOpen: false,
      authError: null,
      otpSent: false,
    }),

  openHistory: () => {
    set({ isHistoryOpen: true });
    get().loadHistory();
  },

  closeHistory: () => set({ isHistoryOpen: false }),

  clearError: () => set({ authError: null }),

  requestOtp: async (email: string) => {
    set({ isLoadingAuth: true, authError: null });
    try {
      await sendOtp(email);
      set({
        otpSent: true,
        targetEmail: email,
        isLoadingAuth: false,
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP code.';
      set({ authError: msg, isLoadingAuth: false });
      return false;
    }
  },

  confirmOtp: async (code: string, onSuccess) => {
    const { targetEmail } = get();
    set({ isLoadingAuth: true, authError: null });
    try {
      const res = await verifyOtp(targetEmail, code);
      localStorage.setItem(TOKEN_KEY, res.token);
      set({
        token: res.token,
        user: res.user,
        isAuthModalOpen: false,
        otpSent: false,
        isLoadingAuth: false,
      });

      // Fetch user profile and usage status after login
      try {
        const me = await fetchMe(res.token);
        if (onSuccess && me.usageStatus) {
          onSuccess(me.usageStatus);
        }
      } catch {
        // Usage fetch error non-blocking
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP.';
      set({ authError: msg, isLoadingAuth: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({
      token: null,
      user: null,
      isHistoryOpen: false,
      history: [],
    });
  },

  initSession: async (onSessionLoaded) => {
    const token = get().token;
    if (!token) return;

    try {
      const me = await fetchMe(token);
      set({ user: me.user });
      if (onSessionLoaded && me.usageStatus) {
        onSessionLoaded(me.usageStatus);
      }
    } catch {
      // Invalid/expired token — clear
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null });
    }
  },

  loadHistory: async () => {
    const token = get().token;
    if (!token) return;

    set({ isLoadingHistory: true });
    try {
      const history = await fetchHistory(token);
      set({ history, isLoadingHistory: false });
    } catch {
      set({ history: [], isLoadingHistory: false });
    }
  },
}));
