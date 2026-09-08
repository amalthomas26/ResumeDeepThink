import React, { useState } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useCheckStore } from '../store/check-store';

export const LoginModal: React.FC = () => {
  const isAuthModalOpen = useAuthStore((s) => s.isAuthModalOpen);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const confirmOtp = useAuthStore((s) => s.confirmOtp);
  const isLoadingAuth = useAuthStore((s) => s.isLoadingAuth);
  const authError = useAuthStore((s) => s.authError);
  const otpSent = useAuthStore((s) => s.otpSent);
  const targetEmail = useAuthStore((s) => s.targetEmail);
  const clearError = useAuthStore((s) => s.clearError);

  const setUsageStatus = useCheckStore((s) => s.setUsageStatus);

  const [emailInput, setEmailInput] = useState(targetEmail);
  const [codeInput, setCodeInput] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    await requestOtp(emailInput.trim());
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    await confirmOtp(codeInput.trim(), (usage) => {
      if (usage) {
        setUsageStatus(usage);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16213D]/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-md bg-white border border-[#D8DDE3] shadow-xl p-8 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-[#8A94A6] hover:text-[#16213D] transition-colors text-xl leading-none font-mono"
          aria-label="Close modal"
        >
          &times;
        </button>

        {!otpSent ? (
          <div>
            <div className="mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#2C6B4F] font-semibold">
                Account Sign-In
              </span>
              <h2 className="text-2xl font-serif text-[#16213D] font-normal mt-1">
                Save your score history
              </h2>
              <p className="text-sm text-[#4A5568] mt-2 font-serif leading-relaxed">
                Sign in with your email to view previous scans, track score improvements, and preserve your check history across devices.
              </p>
            </div>

            {authError && (
              <div className="mb-5 p-3 text-xs font-mono bg-[#FCEAE5] text-[#C1573B] border border-[#F6C5B8]">
                {authError}
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-mono uppercase tracking-wider text-[#4A5568] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (authError) clearError();
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#EEF1F3]/50 border border-[#D8DDE3] text-[#16213D] focus:outline-none focus:border-[#2C6B4F] focus:bg-white font-serif transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingAuth || !emailInput.trim()}
                className="w-full py-2.5 px-4 bg-[#2C6B4F] hover:bg-[#23563F] text-white text-sm font-mono tracking-wide font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoadingAuth ? 'Sending code…' : 'Send Verification Code'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#EEF1F3] text-center">
              <p className="text-[11px] text-[#8A94A6] font-mono leading-normal">
                No password needed. We'll send a 6-digit one-time code to your inbox.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#2C6B4F] font-semibold">
                Verification Code
              </span>
              <h2 className="text-2xl font-serif text-[#16213D] font-normal mt-1">
                Check your inbox
              </h2>
              <p className="text-sm text-[#4A5568] mt-2 font-serif leading-relaxed">
                We sent a 6-digit code to{' '}
                <span className="font-mono text-[#16213D] font-medium">{targetEmail}</span>.
              </p>
            </div>

            {authError && (
              <div className="mb-5 p-3 text-xs font-mono bg-[#FCEAE5] text-[#C1573B] border border-[#F6C5B8]">
                {authError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-code"
                  className="block text-xs font-mono uppercase tracking-wider text-[#4A5568] mb-1.5"
                >
                  6-Digit One-Time Password
                </label>
                <input
                  id="auth-code"
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="123456"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.replace(/\D/g, ''));
                    if (authError) clearError();
                  }}
                  className="w-full px-3.5 py-3 text-center text-xl tracking-[0.4em] font-mono bg-[#EEF1F3]/50 border border-[#D8DDE3] text-[#16213D] focus:outline-none focus:border-[#2C6B4F] focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingAuth || codeInput.length < 6}
                className="w-full py-2.5 px-4 bg-[#2C6B4F] hover:bg-[#23563F] text-white text-sm font-mono tracking-wide font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoadingAuth ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-xs font-mono text-[#4A5568]">
              <button
                type="button"
                onClick={() => {
                  requestOtp(targetEmail);
                }}
                disabled={isLoadingAuth}
                className="text-[#2C6B4F] hover:underline cursor-pointer disabled:opacity-50"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  useAuthStore.setState({ otpSent: false, authError: null });
                  setCodeInput('');
                }}
                className="text-[#8A94A6] hover:text-[#16213D] cursor-pointer"
              >
                Change email
              </button>
            </div>

            <div className="mt-6 p-3 bg-[#EEF1F3]/60 border border-[#D8DDE3] text-[11px] font-mono text-[#4A5568] leading-relaxed">
              <span className="font-semibold text-[#16213D]">Dev note:</span> The 6-digit OTP code is printed directly in the backend terminal console.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
