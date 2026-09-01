import { describe, expect, it, vi } from 'vitest';
import type { D1Database, D1PreparedStatement } from '@/lib/db';
import { getRaApiConfigSecret } from './raApiConfig.server';

function databaseReturning(row: Record<string, unknown> | null): D1Database {
  const statement = {
    first: vi.fn().mockResolvedValue(row),
  } as unknown as D1PreparedStatement;

  return {
    prepare: vi.fn(() => statement),
  } as unknown as D1Database;
}

describe('getRaApiConfigSecret', () => {
  it.each([
    ['missing row', null],
    ['null key', { user_id: 'user', api_key: null, dj_id: 'dj', option: '1', year: '' }],
    ['empty key', { user_id: 'user', api_key: '', dj_id: 'dj', option: '1', year: '' }],
    ['whitespace key', { user_id: 'user', api_key: '   ', dj_id: 'dj', option: '1', year: '' }],
    ['whitespace user', { user_id: '   ', api_key: 'key', dj_id: 'dj', option: '1', year: '' }],
    ['whitespace DJ', { user_id: 'user', api_key: 'key', dj_id: '   ', option: '1', year: '' }],
  ])('treats %s as not configured', async (_label, row) => {
    await expect(getRaApiConfigSecret(databaseReturning(row))).resolves.toBeNull();
  });

  it('trims configured values before they leave the server-only repository', async () => {
    const db = databaseReturning({
      user_id: ' user ',
      api_key: ' key ',
      dj_id: ' dj ',
      option: '2',
      year: ' 2026 ',
    });

    await expect(getRaApiConfigSecret(db)).resolves.toEqual({
      userId: 'user',
      apiKey: 'key',
      djId: 'dj',
      option: '2',
      year: '2026',
    });
  });
});
