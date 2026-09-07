import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@/lib/db';
import { requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { getDB } from '@/lib/db';
import {
  fetchPerformancesSnapshot,
  replacePerformancesAtRevision,
} from '@/capabilities/events/eventsRepository.server';
import { GET, PUT } from './route';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));
vi.mock('@/capabilities/auth/authRoute.server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/capabilities/auth/authRoute.server')>();
  return { ...actual, requireAdminSession: vi.fn() };
});
vi.mock('@/capabilities/events/eventsRepository.server', () => ({
  fetchPerformancesSnapshot: vi.fn(),
  replacePerformancesAtRevision: vi.fn(),
}));

const database = {} as D1Database;
const performance = {
  id: 'event-1',
  date: '2026-09-20',
  venue: 'Fixture Club',
  title: 'Fixture',
  status: 'Announced' as const,
};

function request(method: 'GET' | 'PUT', body?: unknown) {
  return new NextRequest('https://lumo.test/api/admin/performances', {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('performances route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue(null);
    vi.mocked(getDB).mockReturnValue(database);
  });

  it('returns the list with the revision used for a later save', async () => {
    vi.mocked(fetchPerformancesSnapshot).mockResolvedValue({ items: [performance], revision: 4 });

    const response = await GET(request('GET'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { items: [performance], revision: 4 },
    });
  });

  it.each([
    [null, 'body must be an object'],
    [{ items: [performance] }, 'revision must be a non-negative integer'],
    [{ items: [{ ...performance }, { ...performance }] as unknown[], revision: 4 }, 'items contain an invalid performance'],
    [{ items: [{ ...performance, raEventId: 42 }], revision: 4 }, 'items contain an invalid performance'],
    [{ items: [{ ...performance, raEventId: '42' }, { ...performance, id: 'event-2', raEventId: '42' }] as unknown[], revision: 4 }, 'items contain an invalid performance'],
  ])('rejects malformed replacement input', async (body, message) => {
    const response = await PUT(request('PUT', body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { message } });
    expect(replacePerformancesAtRevision).not.toHaveBeenCalled();
  });

  it('reports a stale revision without calling it a successful save', async () => {
    vi.mocked(replacePerformancesAtRevision).mockResolvedValue({ kind: 'conflict' });

    const response = await PUT(request('PUT', { items: [performance], revision: 4 }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'CONFLICT' } });
  });

  it('returns the canonical saved snapshot', async () => {
    vi.mocked(replacePerformancesAtRevision).mockResolvedValue({
      kind: 'success',
      snapshot: { items: [performance], revision: 7 },
    });

    const response = await PUT(request('PUT', { items: [performance], revision: 4 }));

    expect(replacePerformancesAtRevision).toHaveBeenCalledWith(database, [performance], 4);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { items: [performance], revision: 7 },
    });
  });
});
