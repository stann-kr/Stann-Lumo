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

  assert.equal(packageJson.scripts.dev, 'next dev --port 3004');
  assert.equal(packageJson.scripts.start, 'next start --port 3004');
});

test('Docker exposes and maps the same fixed port 3004', () => {
  const dockerfile = readRepositoryFile('Dockerfile');
  const compose = readRepositoryFile('docker-compose.yml');

  assert.match(dockerfile, /^EXPOSE 3004$/m);
  assert.match(compose, /^\s+- "3004:3004"$/m);
  assert.doesNotMatch(`${dockerfile}\n${compose}`, /\b3000\b/);
});
