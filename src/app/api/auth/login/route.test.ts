import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEnv } from '@/lib/db';
import { buildSessionCookieHeader, createSession } from '@/lib/auth';
import { POST } from './route';

const SessionStorageUnavailableError = vi.hoisted(
  () => class SessionStorageUnavailableError extends Error {},
);

vi.mock('@/lib/db', () => ({ getEnv: vi.fn() }));
vi.mock('@/lib/auth', () => ({
  createSession: vi.fn(),
  buildSessionCookieHeader: vi.fn(),
  SessionStorageUnavailableError,
}));

function loginRequest() {
  return new NextRequest('http://localhost:3004/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password: 'test-password' }),
    headers: { 'content-type': 'application/json' },
  });
}

describe('admin login storage boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnv).mockReturnValue({ ADMIN_PASSWORD: 'test-password' });
  });

  it('does not issue a cookie when the Worker D1 binding is unavailable', async () => {
    vi.mocked(createSession).mockRejectedValue(new SessionStorageUnavailableError());

    const response = await POST(loginRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'DB_UNAVAILABLE' },
    });
    expect(buildSessionCookieHeader).not.toHaveBeenCalled();
  });
});
