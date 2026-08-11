import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readRepositoryFile(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

test('local Node scripts use the fixed port 3004', () => {
  const packageJson = JSON.parse(readRepositoryFile('package.json'));

  assert.equal(packageJson.scripts.dev, 'node --env-file-if-exists=.dev.vars ./node_modules/next/dist/bin/next dev --port 3004');
  assert.equal(packageJson.scripts.build, 'NEXT_DIST_DIR=.next-build NODE_ENV=production next build && next typegen');
  assert.equal(packageJson.scripts.start, 'NEXT_DIST_DIR=.next-build node --env-file-if-exists=.dev.vars ./node_modules/next/dist/bin/next start --port 3004');
});

test('development and standard production builds use separate output directories', () => {
  const nextConfig = readRepositoryFile('next.config.ts');

  assert.match(nextConfig, /distDir:\s*process\.env\.NEXT_DIST_DIR\s*\?\?\s*'\.next'/);
});

test('Docker exposes and maps the same fixed port 3004', () => {
  const dockerfile = readRepositoryFile('Dockerfile');
  const compose = readRepositoryFile('docker-compose.yml');

  assert.match(dockerfile, /^EXPOSE 3004$/m);
  assert.match(compose, /^\s+- "3004:3004"$/m);
  assert.match(compose, /^\s+- \.env$/m);
  assert.match(compose, /^\s+- \.dev\.vars$/m);
  assert.doesNotMatch(`${dockerfile}\n${compose}`, /\b3000\b/);
});
