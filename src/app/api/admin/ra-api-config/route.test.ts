import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database, D1PreparedStatement, D1Result } from '@/lib/db';
import { getDB } from '@/lib/db';
import { privateNoStoreJson, requireAdminSession } from '@/lib/adminAuth';
import { GET, PUT } from './route';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));
vi.mock('@/lib/adminAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/adminAuth')>();
  return { ...actual, requireAdminSession: vi.fn() };
});

interface StatementRecord {
  sql: string;
  bindings: unknown[];
}

function createDatabase(options?: {
  row?: Record<string, unknown> | null;
  throwOnFirst?: boolean;
  throwOnRun?: boolean;
}) {
  const statements: StatementRecord[] = [];

  const database = {
    prepare(sql: string) {
      const record: StatementRecord = { sql, bindings: [] };
      statements.push(record);
      const statement = {
        bind(...values: unknown[]) {
          record.bindings = values;
          return statement;
        },
        async first<T>() {
          if (options?.throwOnFirst) throw new Error('test-only-database-failure');
          return (options?.row ?? null) as T | null;
        },
        async run<T>() {
          if (options?.throwOnRun) throw new Error('test-only-database-failure');
          return { results: [], success: true, meta: {} } as D1Result<T>;
        },
      };
      return statement as D1PreparedStatement;
    },
  } as D1Database;

  return { database, statements };
}

function request(method: 'GET' | 'PUT', body?: unknown) {
  return new NextRequest('https://lumo.test/api/admin/ra-api-config', {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function expectPrivateNoStore(response: Response) {
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
}

describe('admin RA config route compatibility boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue(null);
  });

  it('preserves the authenticated legacy GET while marking it private and no-store', async () => {
    const { database } = createDatabase({
      row: {
        user_id: 'user-fixture',
        api_key: 'test-only-admin-key',
        dj_id: 'dj-fixture',
        option: '2',
        year: '2026',
      },
    });
    vi.mocked(getDB).mockReturnValue(database);

    const response = await GET(request('GET'));
    expect(response.status).toBe(200);
    expectPrivateNoStore(response);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { apiKey: 'test-only-admin-key' },
    });
  });

  it.each([
    ['auth', 401],
    ['database', 503],
    ['catch', 500],
  ] as const)('marks the %s GET response private and no-store', async (branch, status) => {
    if (branch === 'auth') {
      vi.mocked(requireAdminSession).mockResolvedValue(
        privateNoStoreJson({ success: false }, { status }),
      );
    } else if (branch === 'database') {
      vi.mocked(getDB).mockReturnValue(null);
    } else {
      vi.mocked(getDB).mockReturnValue(createDatabase({ throwOnFirst: true }).database);
    }

    const response = await GET(request('GET'));
    expect(response.status).toBe(status);
    expectPrivateNoStore(response);
  });

  it.each([undefined, '', '   '])('preserves the existing key for %j PUT input', async (apiKey) => {
    const { database, statements } = createDatabase();
    vi.mocked(getDB).mockReturnValue(database);

    const response = await PUT(
      request('PUT', {
        raApiConfig: {
          userId: 'user-fixture',
          ...(apiKey === undefined ? {} : { apiKey }),
          djId: 'dj-fixture',
          option: '1',
          year: '',
        },
      }),
    );

    expect(response.status).toBe(200);
    expectPrivateNoStore(response);
    expect(statements[0]?.sql).toContain("COALESCE(NULLIF(TRIM(?), ''), api_key)");
    expect(statements[0]?.bindings[1]).toBe(apiKey ?? null);
  });

  it('passes a nonblank replacement key to the update statement', async () => {
    const { database, statements } = createDatabase();
    vi.mocked(getDB).mockReturnValue(database);

    const response = await PUT(
      request('PUT', {
        raApiConfig: {
          userId: 'user-fixture',
          apiKey: 'test-only-replacement-key',
          djId: 'dj-fixture',
          option: '2',
          year: '2026',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(statements[0]?.bindings[1]).toBe('test-only-replacement-key');
  });

  it('returns the early PUT auth failure unchanged and private', async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(
      privateNoStoreJson({ success: false }, { status: 401 }),
    );

    const response = await PUT(request('PUT', {}));

    expect(response.status).toBe(401);
    expectPrivateNoStore(response);
    expect(getDB).not.toHaveBeenCalled();
  });

  it.each([
    ['database', 503],
    ['validation', 400],
    ['catch', 500],
  ] as const)('marks the %s PUT response private and no-store', async (branch, status) => {
    if (branch === 'database') {
      vi.mocked(getDB).mockReturnValue(null);
    } else if (branch === 'validation') {
      vi.mocked(getDB).mockReturnValue(createDatabase().database);
    } else {
      vi.mocked(getDB).mockReturnValue(createDatabase({ throwOnRun: true }).database);
    }

    const body = branch === 'validation'
      ? {}
      : { raApiConfig: { userId: '', apiKey: '', djId: '', option: '1', year: '' } };
    const response = await PUT(request('PUT', body));

    expect(response.status).toBe(status);
    expectPrivateNoStore(response);
  });
});
