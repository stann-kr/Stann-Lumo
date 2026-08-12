import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBuildDistDir } from './resolve-build-dist-dir.mjs';

test('uses an explicitly requested Next.js output directory', () => {
  assert.equal(resolveBuildDistDir({ NEXT_DIST_DIR: '.custom-next' }), '.custom-next');
});

test('uses the OpenNext-compatible output directory in Workers Builds', () => {
  assert.equal(resolveBuildDistDir({ WORKERS_CI: '1' }), '.next');
});

test('uses an isolated output directory for standard local builds', () => {
  assert.equal(resolveBuildDistDir({}), '.next-build');
});
