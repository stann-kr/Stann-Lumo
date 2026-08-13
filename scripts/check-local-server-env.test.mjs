import assert from 'node:assert/strict';
import test from 'node:test';
import {
  sanitizeLocalWorkerProcessEnvironment,
  selectLocalWorkerEnvironment,
  serializeLocalWorkerEnvironment,
} from './check-local-server-env.mjs';

test('selects only the local Worker allowlist and forces safe runtime values', () => {
  const sentinel = 'test-only-secret-value-never-print';
  const result = selectLocalWorkerEnvironment([
    'ADMIN_PASSWORD=test-password',
    'MIGRATE_ENABLED=true',
    `CLOUDFLARE_API_TOKEN=${sentinel}`,
    '',
  ].join('\n'));
  const serialized = serializeLocalWorkerEnvironment(result.values);

  assert.equal(result.error, null);
  assert.deepEqual(result.excludedKeys.sort(), ['CLOUDFLARE_API_TOKEN', 'MIGRATE_ENABLED']);
  assert.deepEqual(result.values, {
    ADMIN_PASSWORD: 'test-password',
    MIGRATE_ENABLED: 'false',
    NEXTJS_ENV: 'development',
  });
  assert.equal(serialized.includes(sentinel), false);
  assert.doesNotMatch(serialized, /CLOUDFLARE_API_TOKEN/);
});

test('removes remote Cloudflare credentials from the child process environment', () => {
  const sentinel = 'test-only-secret-value-never-print';
  const result = sanitizeLocalWorkerProcessEnvironment({
    PATH: '/bin',
    CLOUDFLARE_ACCOUNT_ID: sentinel,
    CLOUDFLARE_API_TOKEN: sentinel,
    CF_API_TOKEN: sentinel,
  });

  assert.equal(result.PATH, '/bin');
  assert.equal(result.CLOUDFLARE_ACCOUNT_ID, undefined);
  assert.equal(result.CLOUDFLARE_API_TOKEN, undefined);
  assert.equal(result.CF_API_TOKEN, undefined);
  assert.equal(result.CLOUDFLARE_INCLUDE_PROCESS_ENV, 'false');
});

test('fails closed when the local admin password is missing', () => {
  const result = selectLocalWorkerEnvironment('MIGRATE_ENABLED=false\n');

  assert.equal(result.error, 'ADMIN_PASSWORD is required');
  assert.deepEqual(result.values, {});
});
