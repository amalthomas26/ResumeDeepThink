import Database from 'better-sqlite3';
import { OtpService } from '../services/otp.service';
import { DatabaseService } from '../../database/database.service';

describe('OtpService', () => {
  let otpService: OtpService;
  let inMemoryDb: Database.Database;

  beforeEach(() => {
    inMemoryDb = new Database(':memory:');
    inMemoryDb.exec(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    const mockDbService = {
      getDb: () => inMemoryDb,
    } as unknown as DatabaseService;

    otpService = new OtpService(mockDbService);
  });

  afterEach(() => {
    inMemoryDb.close();
  });

  it('generates and stores an OTP code', async () => {
    const success = await otpService.sendOtp('test@example.com');
    expect(success).toBe(true);

    const record = inMemoryDb
      .prepare('SELECT * FROM otp_codes WHERE email = ?')
      .get('test@example.com') as { code: string; expires_at: number; attempts: number };

    expect(record).toBeDefined();
    expect(record.code).toHaveLength(6);
    expect(record.attempts).toBe(0);
  });

  it('verifies valid OTP successfully and removes it', async () => {
    await otpService.sendOtp('test@example.com');

    const record = inMemoryDb
      .prepare('SELECT code FROM otp_codes WHERE email = ?')
      .get('test@example.com') as { code: string };

    const valid = otpService.verifyOtp('test@example.com', record.code);
    expect(valid).toBe(true);

    // Should be consumed (deleted)
    const after = inMemoryDb
      .prepare('SELECT * FROM otp_codes WHERE email = ?')
      .get('test@example.com');
    expect(after).toBeUndefined();
  });

  it('rejects incorrect OTP and increments attempt count', async () => {
    await otpService.sendOtp('test@example.com');

    const valid = otpService.verifyOtp('test@example.com', '000000');
    expect(valid).toBe(false);

    const record = inMemoryDb
      .prepare('SELECT attempts FROM otp_codes WHERE email = ?')
      .get('test@example.com') as { attempts: number };
    expect(record.attempts).toBe(1);
  });

  it('exhausts OTP after 3 failed attempts', async () => {
    await otpService.sendOtp('test@example.com');

    otpService.verifyOtp('test@example.com', '000000');
    otpService.verifyOtp('test@example.com', '000001');
    otpService.verifyOtp('test@example.com', '000002');

    // 4th try should be deleted/rejected
    const valid = otpService.verifyOtp('test@example.com', '000003');
    expect(valid).toBe(false);

    const record = inMemoryDb
      .prepare('SELECT * FROM otp_codes WHERE email = ?')
      .get('test@example.com');
    expect(record).toBeUndefined();
  });

  it('rejects expired OTP', async () => {
    await otpService.sendOtp('test@example.com');

    // Set expiry in past
    inMemoryDb
      .prepare('UPDATE otp_codes SET expires_at = ? WHERE email = ?')
      .run(Date.now() - 1000, 'test@example.com');

    const valid = otpService.verifyOtp('test@example.com', '123456');
    expect(valid).toBe(false);
  });
});
