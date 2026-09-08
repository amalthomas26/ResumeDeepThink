/**
 * Auth interfaces for email OTP login and user management.
 *
 * Per auth-and-tiers.md line 15: "Email + OTP as the primary path
 * (no OAuth app review needed, works for a solo builder day one)."
 */

/** A user record. */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
}

/** Stored OTP for verification. */
export interface OtpRecord {
  readonly email: string;
  readonly code: string;
  readonly expiresAt: number;
  readonly attempts: number;
  readonly createdAt: number;
}

/** JWT payload shape. */
export interface AuthPayload {
  /** User ID (JWT standard claim). */
  sub: string;
  /** User email. */
  email: string;
}

/** A check history entry for the score history view. */
export interface CheckHistoryEntry {
  readonly id: string;
  readonly resumeType: string;
  readonly overallScore: number;
  readonly band: string;
  readonly bandLabel: string;
  readonly fileName: string;
  readonly createdAt: string;
}
