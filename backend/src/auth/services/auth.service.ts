import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import type { User, CheckHistoryEntry } from '../interfaces/auth.interface';

/** Max history entries returned per user. */
const MAX_HISTORY_ENTRIES = 20;

/**
 * AuthService — user management, login-or-create, and history.
 *
 * Per auth-and-tiers.md line 16: "on login, migrate the anonymous
 * device's check history to the account."
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Finds an existing user by email, or creates a new one.
   * Also migrates anonymous check history from the device to the account.
   */
  loginOrCreate(email: string, deviceId: string): User {
    const normalizedEmail = email.toLowerCase().trim();
    const db = this.database.getDb();

    // Try to find existing user
    let user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(normalizedEmail) as User | undefined;

    if (!user) {
      // Create new user
      const id = randomUUID();
      const createdAt = new Date().toISOString();

      db.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)')
        .run(id, normalizedEmail, createdAt);

      user = { id, email: normalizedEmail, createdAt };
      this.logger.log(`New user created: ${normalizedEmail}`);
    } else {
      this.logger.log(`Existing user logged in: ${normalizedEmail}`);
    }

    // Migrate anonymous history to this account
    this.migrateAnonymousHistory(deviceId, user.id);

    return user;
  }

  /**
   * Finds a user by ID (for JWT validation).
   */
  findById(userId: string): User | null {
    const db = this.database.getDb();
    const row = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as User | undefined;
    return row ?? null;
  }

  /**
   * Records a check result in history.
   */
  recordCheckHistory(
    checkId: string,
    userId: string | null,
    deviceId: string,
    resumeType: string,
    overallScore: number,
    band: string,
    bandLabel: string,
    fileName: string,
  ): void {
    const db = this.database.getDb();
    db.prepare(`
      INSERT INTO check_history
        (id, user_id, device_id, resume_type, overall_score, band, band_label, file_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      checkId,
      userId,
      deviceId,
      resumeType,
      overallScore,
      band,
      bandLabel,
      fileName,
      new Date().toISOString(),
    );
  }

  /**
   * Returns the last N check history entries for a user.
   */
  getHistory(userId: string): CheckHistoryEntry[] {
    const db = this.database.getDb();
    const rows = db
      .prepare(`
        SELECT id, resume_type as resumeType, overall_score as overallScore,
               band, band_label as bandLabel, file_name as fileName, created_at as createdAt
        FROM check_history
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(userId, MAX_HISTORY_ENTRIES) as CheckHistoryEntry[];
    return rows;
  }

  /**
   * Migrates anonymous (device-linked) check history rows to the user account.
   *
   * Per auth-and-tiers.md line 16: "migrate the anonymous device's check
   * history to the account (don't discard it)."
   */
  private migrateAnonymousHistory(deviceId: string, userId: string): void {
    const db = this.database.getDb();
    const result = db
      .prepare('UPDATE check_history SET user_id = ? WHERE device_id = ? AND user_id IS NULL')
      .run(userId, deviceId);

    if (result.changes > 0) {
      this.logger.log(
        `Migrated ${result.changes} anonymous history entries to user ${userId.slice(0, 8)}…`,
      );
    }
  }
}
