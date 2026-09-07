import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@/lib/db';
import { getDB } from '@/lib/db';
import { privateNoStoreJson, requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { getRaApiConfigSecret } from '@/capabilities/events/raApiConfig.server';
import { GET } from './route';
import { GET as getSync, POST as postSync } from '../ra-sync/route';
import { DELETE as restoreExclusion } from '../ra-sync/exclusions/route';
import { syncRaEvents } from '@/capabilities/events/raScheduledSync';
import { getRaSyncStatus, restoreRaEvent } from '@/capabilities/events/raSyncState';

vi.mock('@/capabilities/events/raScheduledSync', () => ({ syncRaEvents: vi.fn() }));
vi.mock('@/capabilities/events/raSyncState', () => ({ getRaSyncStatus: vi.fn(), restoreRaEvent: vi.fn() }));

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));
vi.mock('@/capabilities/auth/authRoute.server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/capabilities/auth/authRoute.server')>();
  return { ...actual, requireAdminSession: vi.fn() };
});

describe('admin RA sync operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue(null);
    vi.mocked(getDB).mockReturnValue(database);
  });

  it.each([getSync, postSync, restoreExclusion])('requires authentication before accessing sync state', async (handler) => {
    vi.mocked(requireAdminSession).mockResolvedValue(privateNoStoreJson({ success: false }, { status: 401 }));
    const response = await handler(request());
    expect(response.status).toBe(401);
    expectPrivateNoStore(response);
    expect(syncRaEvents).not.toHaveBeenCalled();
    expect(getRaSyncStatus).not.toHaveBeenCalled();
    expect(restoreRaEvent).not.toHaveBeenCalled();
  });

  it('runs the common sync service only for POST and returns status privately', async () => {
    const status = { lastStatus: 'success', inserted: 2 } as Awaited<ReturnType<typeof getRaSyncStatus>>;
    vi.mocked(getRaSyncStatus).mockResolvedValue(status);
    vi.mocked(syncRaEvents).mockResolvedValue({ kind: 'success', fetched: 3, inserted: 2, skippedExcluded: 1 });
    const read = await getSync(request());
    expect(syncRaEvents).not.toHaveBeenCalled();
    await expect(read.json()).resolves.toEqual({ success: true, data: status });
    const run = await postSync(request());
    expect(syncRaEvents).toHaveBeenCalledWith(database);
    expectPrivateNoStore(run);
    await expect(run.json()).resolves.toMatchObject({ data: { result: { inserted: 2 }, status } });
  });

  it('does not expose upstream or database diagnostics', async () => {
    vi.mocked(syncRaEvents).mockRejectedValue(new Error(secretConfig.apiKey));
    const response = await postSync(request());
    expect(response.status).toBe(503);
    expectPrivateNoStore(response);
    expect(await response.text()).not.toContain(secretConfig.apiKey);
  });

  it('validates exclusion restoration without triggering an import', async () => {
    const makeRequest = (raEventId: unknown) => new NextRequest('https://lumo.test/api/admin/ra-sync/exclusions', {
      method: 'DELETE', body: JSON.stringify({ raEventId }), headers: { 'Content-Type': 'application/json' },
    });
    expect((await restoreExclusion(makeRequest('../42'))).status).toBe(400);
    expect(restoreRaEvent).not.toHaveBeenCalled();
    const response = await restoreExclusion(makeRequest('42'));
    expect(response.status).toBe(200);
    expectPrivateNoStore(response);
    expect(restoreRaEvent).toHaveBeenCalledWith(database, '42');
    expect(syncRaEvents).not.toHaveBeenCalled();
  });
});
vi.mock('@/capabilities/events/raApiConfig.server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/capabilities/events/raApiConfig.server')>();
  return { ...actual, getRaApiConfigSecret: vi.fn() };
});

const database = {} as D1Database;
const secretConfig = {
  userId: 'user-fixture',
  apiKey: 'test-only-secret-never-return',
  djId: 'dj-fixture',
  option: '2' as const,
  year: '2026',
};

function request(search = '') {
  return new NextRequest(`https://lumo.test/api/admin/ra-events${search}`);
}

function expectPrivateNoStore(response: Response) {
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
}

describe('admin RA events proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue(null);
    vi.mocked(getDB).mockReturnValue(database);
    vi.mocked(getRaApiConfigSecret).mockResolvedValue(secretConfig);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns XML privately while keeping credentials server-side', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<events><event /></events>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request('?option=2&year=2026'));
    const body = await response.text();

    expect(response.status).toBe(200);
    expectPrivateNoStore(response);
    expect(response.headers.get('Content-Type')).toContain('text/xml');
    expect(body).toBe('<events><event /></events>');

    const outboundUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(outboundUrl.searchParams.get('AccessKey')).toBe(secretConfig.apiKey);
    expect(outboundUrl.searchParams.get('UserID')).toBe(secretConfig.userId);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ redirect: 'manual' });
    expect(body).not.toContain(secretConfig.apiKey);
  });

  it.each([
    ['?option=9', 'Invalid RA option'],
    ['?year=20x6', 'Invalid RA year'],
  ] as const)('rejects invalid query %s before reading credentials', async (search, message) => {
    const response = await GET(request(search));

    expect(response.status).toBe(400);
    expectPrivateNoStore(response);
    await expect(response.json()).resolves.toMatchObject({ error: { message } });
    expect(getRaApiConfigSecret).not.toHaveBeenCalled();
  });

  it('returns an authenticated not-configured response privately', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(getRaApiConfigSecret).mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status).toBe(400);
    expectPrivateNoStore(response);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['raw', (value: string) => value],
    ['XML escaped', (value: string) => value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;')],
    ['URL encoded', (value: string) => encodeURIComponent(value)],
    ['form encoded', (value: string) => new URLSearchParams({ value }).toString().slice('value='.length)],
  ] as const)('fails closed when a successful upstream body reflects the %s key', async (_kind, encode) => {
    const reflectedConfig = { ...secretConfig, apiKey: "key<& /'fixture" };
    vi.mocked(getRaApiConfigSecret).mockResolvedValue(reflectedConfig);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(`<events><message>${encode(reflectedConfig.apiKey)}</message></events>`),
      ),
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await GET(request());
    const body = await response.text();

    expect(response.status).toBe(502);
    expectPrivateNoStore(response);
    expect(body).not.toContain(reflectedConfig.apiKey);
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(reflectedConfig.apiKey);
    errorSpy.mockRestore();
  });

  it('does not reflect upstream credentials or thrown error details', async () => {
    const sentinel = secretConfig.apiKey;
    vi.mocked(getRaApiConfigSecret).mockRejectedValue(new Error(sentinel));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await GET(request());
    const body = await response.text();

    expect(response.status).toBe(500);
    expectPrivateNoStore(response);
    expect(body).not.toContain(sentinel);
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(sentinel);
    errorSpy.mockRestore();
  });

  it.each([
    ['a cross-host redirect without following it', new Response('', {
      status: 302,
      headers: { Location: 'https://untrusted.example/collect' },
    })],
    ['a rate-limited response', new Response('', { status: 429 })],
  ] as const)('returns %s privately without exposing the outbound URL', async (_kind, upstream) => {
    const fetchMock = vi.fn().mockResolvedValue(upstream);
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request());
    const body = await response.text();

    expect(response.status).toBe(502);
    expectPrivateNoStore(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ redirect: 'manual' });
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).origin).toBe('https://www.residentadvisor.net');
    expect(body).not.toContain(secretConfig.apiKey);
    expect(body).not.toContain('residentadvisor.net');
  });

  it('returns a generic response when the upstream transport fails', async () => {
    const sentinel = secretConfig.apiKey;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(sentinel)));

    const response = await GET(request());
    const body = await response.text();

    expect(response.status).toBe(502);
    expectPrivateNoStore(response);
    expect(body).not.toContain(sentinel);
    expect(body).not.toContain('residentadvisor.net');
  });

  it.each([
    ['auth', 401],
    ['database', 503],
  ] as const)('returns the %s boundary privately', async (branch, status) => {
    if (branch === 'auth') {
      vi.mocked(requireAdminSession).mockResolvedValue(
        privateNoStoreJson({ success: false }, { status }),
      );
    } else {
      vi.mocked(getDB).mockReturnValue(null);
    }

    const response = await GET(request());

    expect(response.status).toBe(status);
    expectPrivateNoStore(response);
  });
});
