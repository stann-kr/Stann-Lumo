import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  LOCAL_SERVER_ENV_KEYS,
  migrateLocalServerEnvironment,
  splitLocalServerEnvironment,
} from './migrate-local-server-env.mjs';

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
  assert.match(result.retained, /CLOUDFLARE_API_TOKEN/);
  assert.match(result.retained, /NEXT_PUBLIC_TERMINAL_URL/);
  assert.match(result.retained, /NEXT_PUBLIC_FORM_ENDPOINT/);
  assert.match(result.moved, /ADMIN_PASSWORD/);
  assert.doesNotMatch(result.moved, /CLOUDFLARE_ACCOUNT_ID/);
  assert.deepEqual([...result.seen].sort(), ['ADMIN_PASSWORD']);
  assert.deepEqual([...LOCAL_SERVER_ENV_KEYS], ['ADMIN_PASSWORD']);
});

test('refuses to move remote D1 credentials into local app configuration', (t) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'stann-lumo-local-env-'));
  t.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(temporaryDirectory, '.env'),
    'ADMIN_PASSWORD=test-password\nCLOUDFLARE_API_TOKEN=test-token\n',
  );

  assert.throws(
    () => migrateLocalServerEnvironment(temporaryDirectory),
    /Remote D1 credentials are not supported/,
  );
  assert.equal(fs.existsSync(path.join(temporaryDirectory, '.dev.vars')), false);
});
