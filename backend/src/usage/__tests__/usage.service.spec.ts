import Database from 'better-sqlite3';
import { UsageService } from '../services/usage.service';
import { DatabaseService } from '../../database/database.service';
import { DeviceIdentity } from '../interfaces/usage.interface';

describe('UsageService', () => {
  let usageService: UsageService;
  let mockDbService: DatabaseService;
  let inMemoryDb: Database.Database;

  const mockDevice: DeviceIdentity = {
    deviceId: 'test-device-12345',
    fingerprintHash: 'test-hash-67890',
  };

  beforeEach(() => {
    inMemoryDb = new Database(':memory:');
    inMemoryDb.exec(`
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
    `);

    mockDbService = {
      getDb: () => inMemoryDb,
    } as unknown as DatabaseService;

    usageService = new UsageService(mockDbService);
  });

  afterEach(() => {
    inMemoryDb.close();
  });

  it('allows check when no checks have been used', () => {
    const status = usageService.checkAvailability(mockDevice);
    expect(status.allowed).toBe(true);
    expect(status.used).toBe(0);
    expect(status.limit).toBe(5);
    expect(status.remaining).toBe(5);
  });

  it('records checks and decrements remaining checks', () => {
    usageService.recordCheck(mockDevice);
    const status = usageService.checkAvailability(mockDevice);
    expect(status.allowed).toBe(true);
    expect(status.used).toBe(1);
    expect(status.remaining).toBe(4);
  });

  it('enforces maximum of cookie count and fingerprint count for anonymous users', () => {
    // Simulate cookie being cleared (new deviceId, same fingerprint)
    const today = new Date().toISOString().slice(0, 10);
    inMemoryDb.prepare(`
      INSERT INTO fingerprint_checks (fingerprint_hash, check_date, check_count)
      VALUES (?, ?, 3)
    `).run(mockDevice.fingerprintHash, today);

    const freshDevice: DeviceIdentity = {
      deviceId: 'brand-new-cookie',
      fingerprintHash: mockDevice.fingerprintHash,
    };

    const status = usageService.checkAvailability(freshDevice);
    expect(status.used).toBe(3);
    expect(status.remaining).toBe(2);
  });

  it('blocks check when daily limit of 5 is reached', () => {
    for (let i = 0; i < 5; i++) {
      usageService.recordCheck(mockDevice);
    }
    const status = usageService.checkAvailability(mockDevice);
    expect(status.allowed).toBe(false);
    expect(status.used).toBe(5);
    expect(status.remaining).toBe(0);
  });

  it('tracks checks independently by user account when logged in', () => {
    const userId = 'user-abc-123';
    usageService.recordCheck(mockDevice, userId);

    const status = usageService.checkAvailability(mockDevice, userId);
    expect(status.used).toBe(1);
    expect(status.remaining).toBe(4);
  });
});
