import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocalPreviewArgs, parseLocalWorkerOptions } from './run-local-worker.mjs';

test('local preview always uses local bindings and an explicit sanitized env file', () => {
  const args = buildLocalPreviewArgs('/tmp/local-worker.env', '127.0.0.1');

  assert.deepEqual(args.slice(1), [
    'dev',
    '--local',
    '--env-file',
    '/tmp/local-worker.env',
    '--ip',
    '127.0.0.1',
    '--port',
    '3004',
  ]);
  assert.equal(args.includes('--remote'), false);
});

test('Docker may listen inside the container but arbitrary interfaces are rejected', () => {
  assert.deepEqual(parseLocalWorkerOptions(['--ip', '0.0.0.0']), {
    ip: '0.0.0.0',
    prepareOnly: false,
    nextOnly: false,
  });
  assert.throws(() => parseLocalWorkerOptions(['--ip', '192.0.2.1']), /Local Worker IP/);
});
