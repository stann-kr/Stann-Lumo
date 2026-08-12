import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('the lockfile includes every optional Sharp platform package', () => {
  const lockfile = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package-lock.json'), 'utf8'));
  const rootPackage = lockfile.packages[''];
  const sharpPackage = lockfile.packages['node_modules/sharp'];

  assert.equal(rootPackage.optionalDependencies?.sharp, '0.34.5');
  assert.ok(sharpPackage, 'Sharp must remain present in the lockfile.');

  for (const packageName of Object.keys(sharpPackage.optionalDependencies ?? {})) {
    assert.ok(lockfile.packages[`node_modules/${packageName}`], `Missing lockfile entry: ${packageName}`);
  }
});
