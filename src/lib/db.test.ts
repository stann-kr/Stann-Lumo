import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDB, type D1Database } from './db';

vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: vi.fn() }));

const remoteCredentialKeys = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'] as const;
const originalCredentials = Object.fromEntries(
  remoteCredentialKeys.map((key) => [key, process.env[key]]),
) as Record<(typeof remoteCredentialKeys)[number], string | undefined>;

describe('database runtime boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of remoteCredentialKeys) {
      const value = originalCredentials[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('uses the native Worker binding when it is available', () => {
    const database = {} as D1Database;
    vi.mocked(getCloudflareContext).mockReturnValue({ env: { DB: database } } as never);

    expect(getDB()).toBe(database);
  });

  it('never constructs a remote D1 client in Node, even if credentials are present', () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
    process.env.CLOUDFLARE_API_TOKEN = 'test-token';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.mocked(getCloudflareContext).mockImplementation(() => {
      throw new Error('Worker context unavailable');
    });

    expect(getDB()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
