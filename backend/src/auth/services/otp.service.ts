import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import type { OtpRecord } from '../interfaces/auth.interface';

/** OTP expiry: 10 minutes. */
const OTP_EXPIRY_MS = 10 * 60 * 1000;

/** Max verification attempts per OTP. */
const MAX_OTP_ATTEMPTS = 3;

/** Max OTP sends per email per hour. */
const MAX_SENDS_PER_HOUR = 3;

/**
 * OtpService — generates, stores, and verifies one-time passwords.
 *
 * In dev mode, OTPs are logged to the console.
 * A pluggable email transport can be added later
 * (Resend, Nodemailer, etc.) via an EMAIL_TRANSPORT env var.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Generates and stores a 6-digit OTP for the given email.
   * Rate-limited to MAX_SENDS_PER_HOUR sends per email per hour.
   *
   * @returns true if OTP was created, false if rate-limited.
   */
  async sendOtp(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit check: count recent OTPs for this email
    if (this.isRateLimited(normalizedEmail)) {
      this.logger.warn(`OTP rate limit hit for ${normalizedEmail}`);
      return false;
    }

    // Generate 6-digit code
    const code = this.generateCode();
    const now = Date.now();

    // Upsert the OTP record
    const db = this.database.getDb();
    db.prepare(`
      INSERT INTO otp_codes (email, code, expires_at, attempts, created_at)
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(email) DO UPDATE SET
        code = excluded.code,
        expires_at = excluded.expires_at,
        attempts = 0,
        created_at = excluded.created_at
    `).run(normalizedEmail, code, now + OTP_EXPIRY_MS, now);

    // In dev: log to console (the "pluggable transport" approach)
    this.logger.log(`[OTP] ${normalizedEmail} → ${code}`);

    return true;
  }

  /**
   * Verifies an OTP code.
   *
   * @returns true if valid; false if expired, wrong, or exhausted attempts.
   */
  verifyOtp(email: string, code: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const db = this.database.getDb();

    const record = db
      .prepare('SELECT * FROM otp_codes WHERE email = ?')
      .get(normalizedEmail) as OtpRecord | undefined;

    if (!record) {
      return false;
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      this.deleteOtp(normalizedEmail);
      return false;
    }

    // Check attempt budget
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      this.deleteOtp(normalizedEmail);
      return false;
    }

    // Increment attempt count
    db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE email = ?')
      .run(normalizedEmail);

    // Verify code (constant-time comparison not critical for OTP,
    // but we do a simple strict equality check)
    if (record.code !== code) {
      return false;
    }

    // Success — consume the OTP
    this.deleteOtp(normalizedEmail);
    return true;
  }

  // ─── Private helpers ────────────────────────────────────────

  private generateCode(): string {
    // 6-digit code, zero-padded
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private isRateLimited(email: string): boolean {
    const db = this.database.getDb();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Count OTPs created in the last hour for this email
    // (We only store the latest, so we check if it was created recently
    //  and also count against a simple in-memory approach)
    const record = db
      .prepare('SELECT created_at FROM otp_codes WHERE email = ? AND created_at > ?')
      .get(email, oneHourAgo) as { created_at: number } | undefined;

    // Simple rate limit: if an OTP exists and was created within the last
    // (60/MAX_SENDS_PER_HOUR) minutes, rate-limit
    if (record) {
      const minIntervalMs = (60 * 60 * 1000) / MAX_SENDS_PER_HOUR;
      const timeSinceLastSend = Date.now() - record.created_at;
      if (timeSinceLastSend < minIntervalMs) {
        return true;
      }
    }

    return false;
  }

  private deleteOtp(email: string): void {
    this.database.getDb()
      .prepare('DELETE FROM otp_codes WHERE email = ?')
      .run(email);
  }
}
