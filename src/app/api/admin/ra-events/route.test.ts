import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@/lib/db';
import { getDB } from '@/lib/db';
import { privateNoStoreJson, requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { getRaApiConfigSecret } from '@/capabilities/events/raApiConfig.server';
import { GET } from './route';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));
vi.mock('@/capabilities/auth/authRoute.server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/capabilities/auth/authRoute.server')>();
  return { ...actual, requireAdminSession: vi.fn() };
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

  it('returns upstream failures privately without exposing the outbound URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));

    const response = await GET(request());
    const body = await response.text();

    expect(response.status).toBe(502);
    expectPrivateNoStore(response);
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
