import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateSession } from './auth';
import { requireAdminSession } from './adminAuth';

vi.mock('./auth', () => ({
  SESSION_COOKIE_NAME: 'admin_session',
  validateSession: vi.fn(),
}));

function request(cookie?: string) {
  return new NextRequest('https://lumo.test/api/admin/ra-api-config', {
    headers: cookie ? { cookie: `admin_session=${cookie}` } : undefined,
  });
}

describe('requireAdminSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns private no-store when the session cookie is missing', async () => {
    const response = await requireAdminSession(request());

    expect(response?.status).toBe(401);
    expect(response?.headers.get('Cache-Control')).toBe('private, no-store');
    expect(validateSession).not.toHaveBeenCalled();
  });

  it('returns private no-store when session validation rejects', async () => {
    vi.mocked(validateSession).mockRejectedValue(new Error('test-only-database-failure'));

    const response = await requireAdminSession(request('test-only-session'));

    expect(response?.status).toBe(401);
    expect(response?.headers.get('Cache-Control')).toBe('private, no-store');
    await expect(response?.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED', message: 'Session validation failed' },
    });
  });

  it('returns null only for a valid session', async () => {
    vi.mocked(validateSession).mockResolvedValue(true);

    await expect(requireAdminSession(request('test-only-session'))).resolves.toBeNull();
  });
});
