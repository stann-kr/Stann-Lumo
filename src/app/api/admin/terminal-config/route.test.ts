import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import { getDB } from '@/lib/db';
import {
  fetchTerminalConfig,
  updateTerminalConfig,
} from '@/capabilities/terminal/terminalConfig.server';
import { GET, PUT } from './route';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));
vi.mock('@/lib/adminAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/adminAuth')>();
  return { ...actual, requireAdminSession: vi.fn() };
});
vi.mock('@/capabilities/terminal/terminalConfig.server', () => ({
  fetchTerminalConfig: vi.fn(),
  updateTerminalConfig: vi.fn(),
}));

const database = {} as D1Database;
const config = {
  url: 'https://terminal.example',
  description: 'fixture',
  customFields: [],
  style: { fontSize: 'md' as const, animationSpeed: 'normal' as const, promptText: '>', showEmbed: false, embedHeight: '400px' },
};

function request(method: 'GET' | 'PUT', body?: unknown) {
  return new NextRequest('https://lumo.test/api/admin/terminal-config', {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('terminal config route facade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue(null);
    vi.mocked(getDB).mockReturnValue(database);
  });

  it('returns the auth response before accessing database or capability', async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(
      NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }),
    );

    const response = await GET(request('GET'));

    expect(response.status).toBe(401);
    expect(getDB).not.toHaveBeenCalled();
    expect(fetchTerminalConfig).not.toHaveBeenCalled();
  });

  it('delegates GET after auth and preserves the success envelope', async () => {
    vi.mocked(fetchTerminalConfig).mockResolvedValue(config);

    const response = await GET(request('GET'));

    expect(fetchTerminalConfig).toHaveBeenCalledWith(database);
    await expect(response.json()).resolves.toEqual({ success: true, data: config });
  });

  it('rejects a missing config without calling persistence', async () => {
    const response = await PUT(request('PUT', {}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'config is required' },
    });
    expect(updateTerminalConfig).not.toHaveBeenCalled();
  });

  it('delegates PUT after auth and preserves the success envelope', async () => {
    const response = await PUT(request('PUT', { config }));

    expect(updateTerminalConfig).toHaveBeenCalledWith(database, config);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
