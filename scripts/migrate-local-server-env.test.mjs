import assert from 'node:assert/strict';
import test from 'node:test';
import { LOCAL_SERVER_ENV_KEYS, splitLocalServerEnvironment } from './migrate-local-server-env.mjs';

test('moves only local server keys out of the Next.js environment file', () => {
  const source = [
    'NEXT_PUBLIC_TERMINAL_URL=https://terminal.example.test',
    'ADMIN_PASSWORD=test-value',
    'CLOUDFLARE_ACCOUNT_ID=test-account',
    'CLOUDFLARE_API_TOKEN=test-token',
    'NEXT_PUBLIC_FORM_ENDPOINT=',
    '',
  ].join('\n');

  const result = splitLocalServerEnvironment(source);

  assert.equal(result.retained.includes('ADMIN_PASSWORD'), false);
  assert.equal(result.retained.includes('CLOUDFLARE_API_TOKEN'), false);
  assert.match(result.retained, /NEXT_PUBLIC_TERMINAL_URL/);
  assert.match(result.retained, /NEXT_PUBLIC_FORM_ENDPOINT/);
  assert.match(result.moved, /ADMIN_PASSWORD/);
  assert.match(result.moved, /CLOUDFLARE_ACCOUNT_ID/);
  assert.deepEqual([...result.seen].sort(), [...LOCAL_SERVER_ENV_KEYS].filter((key) => key !== 'MIGRATE_ENABLED').sort());
});
