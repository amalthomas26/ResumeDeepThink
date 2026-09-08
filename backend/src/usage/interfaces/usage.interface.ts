/**
 * Usage tracking interfaces.
 *
 * Per auth-and-tiers.md: device fingerprint (cookie + IP/UA hash)
 * is the primary tracking mechanism for anonymous users.
 */

/** Two-signal device identity per auth-and-tiers.md lines 7–9. */
export interface DeviceIdentity {
  /** Random UUID from the signed HTTP-only cookie. */
  readonly deviceId: string;
  /** SHA-256(IP + '|' + User-Agent) — coarse secondary signal. */
  readonly fingerprintHash: string;
}

/** Result of a usage availability check. */
export interface UsageStatus {
  /** Whether the user/device is allowed to run another check. */
  readonly allowed: boolean;
  /** Number of checks used today. */
  readonly used: number;
  /** Daily check limit. */
  readonly limit: number;
  /** Remaining checks today. */
  readonly remaining: number;
}

/** Daily check limit — 5 per day for everyone. */
export const DAILY_CHECK_LIMIT = 5;
