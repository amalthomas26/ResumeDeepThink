import Database from 'better-sqlite3';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../../database/database.service';

describe('AuthService', () => {
  let authService: AuthService;
  let inMemoryDb: Database.Database;

  beforeEach(() => {
    inMemoryDb = new Database(':memory:');
    inMemoryDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL
      );
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

    const mockDbService = {
      getDb: () => inMemoryDb,
    } as unknown as DatabaseService;

    authService = new AuthService(mockDbService);
  });

  afterEach(() => {
    inMemoryDb.close();
  });

  it('creates new user on first login and normalizes email', () => {
    const user = authService.loginOrCreate('  User@Example.COM ', 'dev-1');
    expect(user).toBeDefined();
    expect(user.email).toBe('user@example.com');
    expect(user.id).toBeDefined();

    const inDb = inMemoryDb
      .prepare('SELECT * FROM users WHERE email = ?')
      .get('user@example.com') as { id: string; email: string };
    expect(inDb.id).toBe(user.id);
  });

  it('returns existing user on repeat login', () => {
    const first = authService.loginOrCreate('test@example.com', 'dev-1');
    const second = authService.loginOrCreate('test@example.com', 'dev-2');
    expect(second.id).toBe(first.id);
  });

  it('migrates anonymous check history to the user account on login', () => {
    // Record anonymous check
    authService.recordCheckHistory(
      'chk-1',
      null,
      'dev-1',
      'tech',
      78,
      'good',
      'Competitive ATS Score',
      'resume.pdf',
    );

    // Login with dev-1
    const user = authService.loginOrCreate('test@example.com', 'dev-1');

    // Check that history is now linked to user.id
    const history = authService.getHistory(user.id);
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('chk-1');
    expect(history[0].overallScore).toBe(78);
  });

  it('retrieves user by id', () => {
    const created = authService.loginOrCreate('findme@example.com', 'dev-1');
    const found = authService.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.email).toBe('findme@example.com');

    const notFound = authService.findById('non-existent-id');
    expect(notFound).toBeNull();
  });
});
