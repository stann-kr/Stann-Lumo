import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  formatOpenNextEnvIssues,
  inspectOpenNextEnvArtifact,
  inspectOpenNextEnvSources,
} from './check-opennext-env.mjs';

const scriptPath = fileURLToPath(new URL('./check-opennext-env.mjs', import.meta.url));

function withTempDirectory(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lumo-opennext-env-'));
  try {
    return run(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('source gate accepts only the exact public allowlist', () => {
  withTempDirectory((directory) => {
    fs.writeFileSync(
      path.join(directory, '.env'),
      'NEXT_PUBLIC_SITE_URL=https://example.test\nNEXT_PUBLIC_HUB_URL=https://hub.example.test\n',
    );

    assert.deepEqual(inspectOpenNextEnvSources(directory), []);
  });
});

test('source gate rejects unknown and server-only keys without formatting values', () => {
  withTempDirectory((directory) => {
    const sentinel = 'test-only-secret-value-never-print';
    fs.writeFileSync(
      path.join(directory, '.env.production.local'),
      `NEXT_PUBLIC_UNKNOWN=${sentinel}\nADMIN_PASSWORD=${sentinel}\n`,
    );

    const issues = inspectOpenNextEnvSources(directory);
    const output = formatOpenNextEnvIssues(issues, directory);

    assert.deepEqual(issues.map(({ key }) => key).sort(), ['ADMIN_PASSWORD', 'NEXT_PUBLIC_UNKNOWN']);
    assert.equal(output.includes(sentinel), false);
    assert.equal(output.includes('ADMIN_PASSWORD'), true);
  });
});

test('artifact gate checks all three OpenNext mode exports without executing them', () => {
  withTempDirectory((directory) => {
    const artifactPath = path.join(directory, 'next-env.mjs');
    fs.writeFileSync(
      artifactPath,
      [
        'export const production = {"NEXT_PUBLIC_SITE_URL":"https://example.test"};',
        'export const development = {"NEXT_PUBLIC_TERMINAL_URL":"https://terminal.example.test"};',
        'export const test = {"CLOUDFLARE_API_TOKEN":"test-only-secret-value-never-print"};',
      ].join('\n'),
    );

    const issues = inspectOpenNextEnvArtifact(artifactPath);
    assert.deepEqual(issues.map(({ key }) => key), ['test:CLOUDFLARE_API_TOKEN']);
  });
});

test('CLI failure output contains rejected keys but never their values', () => {
  withTempDirectory((directory) => {
    const sentinel = 'test-only-secret-value-never-print';
    fs.writeFileSync(path.join(directory, '.env'), `MIGRATE_ENABLED=${sentinel}\n`);

    let output = '';
    try {
      execFileSync(process.execPath, [scriptPath, 'source', '--root', directory], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      assert.fail('expected the source gate to reject MIGRATE_ENABLED');
    } catch (error) {
      const result = error;
      output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    }

    assert.equal(output.includes('MIGRATE_ENABLED'), true);
    assert.equal(output.includes(sentinel), false);
  });
});
