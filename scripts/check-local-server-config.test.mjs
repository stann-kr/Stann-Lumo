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

  assert.equal(
    packageJson.scripts.dev,
    'node scripts/run-local-worker.mjs --ip 127.0.0.1',
  );
  assert.equal(
    packageJson.scripts['dev:docker'],
    'node scripts/run-local-worker.mjs --ip 0.0.0.0',
  );
  assert.equal(packageJson.scripts['dev:next'], 'node scripts/run-local-worker.mjs --next --ip 127.0.0.1');
  assert.equal(packageJson.scripts['local:d1:apply'], 'wrangler d1 migrations apply stann-lumo-db --local');
  assert.equal(packageJson.scripts['local:prepare'], 'node scripts/run-local-worker.mjs --prepare-only');
  assert.equal(packageJson.scripts.build, 'NEXT_DIST_DIR=$(node scripts/resolve-build-dist-dir.mjs) NODE_ENV=production next build && next typegen');
  assert.equal(packageJson.scripts.start, 'NEXT_DIST_DIR=.next-build node ./node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3004');
  assert.match(packageJson.scripts['build:cloudflare'], /NEXT_DIST_DIR=\.next opennextjs-cloudflare build/);
});

test('development and standard production builds use separate output directories', () => {
  const nextConfig = readRepositoryFile('next.config.ts');

  assert.match(nextConfig, /distDir:\s*process\.env\.NEXT_DIST_DIR\s*\?\?\s*'\.next'/);
});

test('Docker binds the local Worker preview to loopback on port 3004', () => {
  const dockerfile = readRepositoryFile('Dockerfile');
  const compose = readRepositoryFile('docker-compose.yml');

  assert.match(dockerfile, /^FROM node:22-bookworm-slim$/m);
  assert.doesNotMatch(dockerfile, /^FROM .*alpine.*$/m);
  assert.match(dockerfile, /^RUN npm ci$/m);
  assert.doesNotMatch(dockerfile, /^RUN npm install$/m);
  assert.match(dockerfile, /^EXPOSE 3004$/m);
  assert.match(dockerfile, /^CMD \["npm", "run", "dev:docker"\]$/m);
  assert.match(compose, /^\s+- "127\.0\.0\.1:3004:3004"$/m);
  assert.match(compose, /^\s+source: \.dev\.vars$/m);
  assert.match(compose, /^\s+target: \/app\/\.dev\.vars$/m);
  assert.match(compose, /^\s+read_only: true$/m);
  assert.doesNotMatch(compose, /^\s+- \.:\/app$/m);
  assert.doesNotMatch(compose, /^\s+- \/app\/\.(?:next|open-next)$/m);
  assert.match(compose, /^\s+- \.env$/m);
  assert.doesNotMatch(compose, /^\s+- \.dev\.vars$/m);
  assert.doesNotMatch(`${dockerfile}\n${compose}`, /\b3000\b/);
});
