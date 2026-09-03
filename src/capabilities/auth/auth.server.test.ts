import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDB } from '@/lib/db';
import {
  createSession,
  SessionStorageUnavailableError,
  validateSession,
} from './auth.server';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));

describe('database-backed admin sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not issue a session without a D1 binding', async () => {
    vi.mocked(getDB).mockReturnValue(null);

    await expect(createSession()).rejects.toBeInstanceOf(SessionStorageUnavailableError);
  });

  it('rejects the former predictable development cookie when storage is unavailable', async () => {
    vi.mocked(getDB).mockReturnValue(null);

    await expect(validateSession('dev-session')).resolves.toBe(false);
  });
});
