import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  type DeviceIdentity,
  type UsageStatus,
  DAILY_CHECK_LIMIT,
} from '../interfaces/usage.interface';

/**
 * UsageService — single source of truth for "can this request run a check."
 *
 * Per auth-and-tiers.md line 20: "One UsageModule function, called before
 * any check starts." Per architecture.md line 36: "Checks device fingerprint /
 * user ID against counters before FileIngestModule even runs."
 *
 * Simplified model (per user request): 5 checks per day for everyone.
 * - Anonymous: tracked by max(cookie count, fingerprint count)
 * - Logged-in: tracked by user account
 *
 * Daily reset uses UTC date boundaries.
 */
@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Checks whether the device/user is allowed to run another check today.
   *
   * Per auth-and-tiers.md line 10: "Count = max of what either signal
   * reports, not sum — trust the higher number."
   */
  checkAvailability(
    device: DeviceIdentity,
    userId?: string,
  ): UsageStatus {
    const today = this.todayUtc();
    let used: number;

    if (userId) {
      // Logged-in: account-based tracking
      used = this.getUserCheckCount(userId, today);
    } else {
      // Anonymous: max(cookie, fingerprint) per auth-and-tiers.md
      const cookieCount = this.getDeviceCheckCount(device.deviceId, today);
      const fpCount = this.getFingerprintCheckCount(device.fingerprintHash, today);
      used = Math.max(cookieCount, fpCount);
    }

    const remaining = Math.max(0, DAILY_CHECK_LIMIT - used);
    return {
      allowed: remaining > 0,
      used,
      limit: DAILY_CHECK_LIMIT,
      remaining,
    };
  }

  /**
   * Records a check against all applicable signals.
   * Must be called after a successful scoring run, not before.
   */
  recordCheck(device: DeviceIdentity, userId?: string): void {
    const today = this.todayUtc();

    if (userId) {
      this.incrementUserCheck(userId, today);
    }

    // Always record against device signals (even for logged-in users)
    // so that if they log out, the device still reflects usage
    this.incrementDeviceCheck(device.deviceId, today);
    this.incrementFingerprintCheck(device.fingerprintHash, today);

    this.logger.debug(
      `Check recorded: device=${device.deviceId.slice(0, 8)}… ` +
        `${userId ? `user=${userId.slice(0, 8)}…` : 'anonymous'}`,
    );
  }

  // ─── Private: SQLite queries ────────────────────────────────

  private getDeviceCheckCount(deviceId: string, date: string): number {
    const db = this.database.getDb();
    const row = db
      .prepare('SELECT check_count FROM device_checks WHERE device_id = ? AND check_date = ?')
      .get(deviceId, date) as { check_count: number } | undefined;
    return row?.check_count ?? 0;
  }

  private getFingerprintCheckCount(hash: string, date: string): number {
    const db = this.database.getDb();
    const row = db
      .prepare('SELECT check_count FROM fingerprint_checks WHERE fingerprint_hash = ? AND check_date = ?')
      .get(hash, date) as { check_count: number } | undefined;
    return row?.check_count ?? 0;
  }

  private getUserCheckCount(userId: string, date: string): number {
    const db = this.database.getDb();
    const row = db
      .prepare('SELECT check_count FROM user_checks WHERE user_id = ? AND check_date = ?')
      .get(userId, date) as { check_count: number } | undefined;
    return row?.check_count ?? 0;
  }

  private incrementDeviceCheck(deviceId: string, date: string): void {
    const db = this.database.getDb();
    db.prepare(`
      INSERT INTO device_checks (device_id, check_date, check_count)
      VALUES (?, ?, 1)
      ON CONFLICT(device_id, check_date)
      DO UPDATE SET check_count = check_count + 1
    `).run(deviceId, date);
  }

  private incrementFingerprintCheck(hash: string, date: string): void {
    const db = this.database.getDb();
    db.prepare(`
      INSERT INTO fingerprint_checks (fingerprint_hash, check_date, check_count)
      VALUES (?, ?, 1)
      ON CONFLICT(fingerprint_hash, check_date)
      DO UPDATE SET check_count = check_count + 1
    `).run(hash, date);
  }

  private incrementUserCheck(userId: string, date: string): void {
    const db = this.database.getDb();
    db.prepare(`
      INSERT INTO user_checks (user_id, check_date, check_count)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, check_date)
      DO UPDATE SET check_count = check_count + 1
    `).run(userId, date);
  }

  /** Returns today's date as YYYY-MM-DD in UTC. */
  private todayUtc(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
