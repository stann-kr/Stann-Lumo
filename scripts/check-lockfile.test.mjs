import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'));
}

function readLockfile() {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package-lock.json'), 'utf8'));
}

test('Cloudflare build tools remain production dependencies', () => {
  const packageJson = readPackageJson();
  const lockfile = readLockfile();

  for (const packageName of ['@opennextjs/cloudflare', 'esbuild', 'wrangler']) {
    assert.ok(packageJson.dependencies?.[packageName], `${packageName} must be a production dependency.`);
    assert.equal(packageJson.devDependencies?.[packageName], undefined, `${packageName} must not be development-only.`);
    assert.ok(lockfile.packages[''].dependencies?.[packageName], `${packageName} must be recorded as a production dependency in the lockfile.`);
  }
});

test('the lockfile includes every optional Sharp platform package', () => {
  const lockfile = readLockfile();
  const rootPackage = lockfile.packages[''];
  const sharpPackage = lockfile.packages['node_modules/sharp'];

  assert.equal(rootPackage.optionalDependencies?.sharp, '0.34.5');
  assert.ok(sharpPackage, 'Sharp must remain present in the lockfile.');

  for (const packageName of Object.keys(sharpPackage.optionalDependencies ?? {})) {
    assert.ok(lockfile.packages[`node_modules/${packageName}`], `Missing lockfile entry: ${packageName}`);
  }
});
