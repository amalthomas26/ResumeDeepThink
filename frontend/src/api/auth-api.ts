import type { User, UsageStatus, CheckHistoryEntry } from '../types/scoring.types';

const API_BASE = 'http://localhost:3000';

export interface VerifyOtpResponse {
  readonly token: string;
  readonly user: User;
}

export interface MeResponse {
  readonly user: User;
  readonly usageStatus: UsageStatus;
}

export async function sendOtp(email: string): Promise<{ sent: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Failed to send OTP (${response.status})`);
  }

  return data as { sent: boolean; message: string };
}

export async function verifyOtp(email: string, code: string): Promise<VerifyOtpResponse> {
  const response = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Verification failed (${response.status})`);
  }

  return data as VerifyOtpResponse;
}

export async function fetchMe(token: string): Promise<MeResponse> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate (${response.status})`);
  }

  return response.json() as Promise<MeResponse>;
}

export async function fetchHistory(token: string): Promise<CheckHistoryEntry[]> {
  const response = await fetch(`${API_BASE}/auth/history`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch history (${response.status})`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.history || []);
}
