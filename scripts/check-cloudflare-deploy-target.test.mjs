import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCloudflareDeployTarget } from './check-cloudflare-deploy-target.mjs';

const commitSha = 'a'.repeat(40);

test('accepts fixed development deploys only from the dev Workers Builds branch', () => {
  assert.deepEqual(
    validateCloudflareDeployTarget('dev', {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'dev',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }),
    { ok: true, mode: 'workers-builds', branch: 'dev', commitSha },
  );

  assert.equal(
    validateCloudflareDeployTarget('dev', {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }).ok,
    false,
  );
});

test('accepts production deploys only from the main Workers Builds branch', () => {
  assert.equal(
    validateCloudflareDeployTarget('production', {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }).ok,
    true,
  );

  assert.equal(
    validateCloudflareDeployTarget('production', {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'dev',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }).ok,
    false,
  );
});

test('keeps feature previews on the development Worker environment', () => {
  assert.equal(
    validateCloudflareDeployTarget('preview', {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'build/cloudflare-environment-separation',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }).ok,
    true,
  );

  for (const branch of ['dev', 'main']) {
    assert.equal(
      validateCloudflareDeployTarget('preview', {
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: branch,
        WORKERS_CI_COMMIT_SHA: commitSha,
      }).ok,
      false,
    );
  }
});

test('requires an exact commit SHA and blocks manual production or preview deploys', () => {
  assert.equal(
    validateCloudflareDeployTarget('dev', {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'dev',
      WORKERS_CI_COMMIT_SHA: 'short',
    }).ok,
    false,
  );
  assert.equal(validateCloudflareDeployTarget('production', {}).ok, false);
  assert.equal(validateCloudflareDeployTarget('preview', {}).ok, false);
});

test('allows only an explicit manual development bootstrap', () => {
  assert.equal(
    validateCloudflareDeployTarget('dev', { ALLOW_MANUAL_CLOUDFLARE_DEPLOY: 'dev' }).ok,
    true,
  );
  assert.equal(
    validateCloudflareDeployTarget('production', { ALLOW_MANUAL_CLOUDFLARE_DEPLOY: 'dev' }).ok,
    false,
  );
});
