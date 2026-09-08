import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

/**
 * DatabaseService — manages the SQLite connection and schema.
 *
 * Uses better-sqlite3 (synchronous, zero-config, file-based).
 * Per implementation plan: "SQLite behind a service abstraction;
 * swap to Redis/Postgres later by changing only this layer."
 *
 * The DB file lives at <cwd>/data/resumepro.db, auto-created.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private db!: Database.Database;

  onModuleInit(): void {
    const dataDir = join(process.cwd(), 'data');
    mkdirSync(dataDir, { recursive: true });

    const dbPath = join(dataDir, 'resumepro.db');
    this.db = new Database(dbPath);

    // WAL mode for better concurrent read/write performance
    this.db.pragma('journal_mode = WAL');

    this.createTables();
    this.logger.log(`SQLite database initialized at ${dbPath}`);
  }

  onModuleDestroy(): void {
    this.db?.close();
    this.logger.log('SQLite database connection closed.');
  }

  /** Returns the raw better-sqlite3 Database instance. */
  getDb(): Database.Database {
    return this.db;
  }

  private createTables(): void {
    this.db.exec(`
      -- ─── Usage Tracking (Phase 4) ───────────────────────────
      CREATE TABLE IF NOT EXISTS device_checks (
        device_id TEXT NOT NULL,
        check_date TEXT NOT NULL,
        check_count INTEGER DEFAULT 0,
        PRIMARY KEY (device_id, check_date)
      );

      CREATE TABLE IF NOT EXISTS fingerprint_checks (
        fingerprint_hash TEXT NOT NULL,
        check_date TEXT NOT NULL,
        check_count INTEGER DEFAULT 0,
        PRIMARY KEY (fingerprint_hash, check_date)
      );

      CREATE TABLE IF NOT EXISTS user_checks (
        user_id TEXT NOT NULL,
        check_date TEXT NOT NULL,
        check_count INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, check_date)
      );

      -- ─── Auth (Phase 5) ─────────────────────────────────────
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS otp_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      -- ─── Check History (Phase 5) ────────────────────────────
      CREATE TABLE IF NOT EXISTS check_history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        device_id TEXT,
        resume_type TEXT,
        overall_score INTEGER,
        band TEXT,
        band_label TEXT,
        file_name TEXT,
        created_at TEXT NOT NULL
      );
    `);
  }
}
