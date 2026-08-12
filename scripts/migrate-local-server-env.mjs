import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const LOCAL_SERVER_ENV_KEYS = new Set([
  'ADMIN_PASSWORD',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'MIGRATE_ENABLED',
]);

function lineKey(line) {
  return line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=/)?.[1] ?? null;
}

export function splitLocalServerEnvironment(source) {
  const moved = [];
  const retained = [];
  const seen = new Set();

  for (const line of source.match(/.*(?:\r?\n|$)/g) ?? []) {
    if (line === '') continue;
    const key = lineKey(line);
    if (key && LOCAL_SERVER_ENV_KEYS.has(key)) {
      moved.push(line);
      seen.add(key);
    } else {
      retained.push(line);
    }
  }

  return { moved: moved.join(''), retained: retained.join(''), seen };
}

export function migrateLocalServerEnvironment(rootDirectory) {
  const sourcePath = path.join(rootDirectory, '.env');
  const destinationPath = path.join(rootDirectory, '.dev.vars');
  if (!fs.existsSync(sourcePath)) throw new Error('Local .env file is required.');
  if (fs.existsSync(destinationPath)) throw new Error('Refusing to overwrite existing .dev.vars.');

  const { moved, retained, seen } = splitLocalServerEnvironment(fs.readFileSync(sourcePath, 'utf8'));
  const missing = [...LOCAL_SERVER_ENV_KEYS].filter((key) => key !== 'MIGRATE_ENABLED' && !seen.has(key));
  if (missing.length > 0) throw new Error(`Missing required local server keys: ${missing.join(', ')}`);
  if (moved.length === 0) throw new Error('No local server keys found in .env.');

  fs.writeFileSync(destinationPath, moved, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  fs.writeFileSync(sourcePath, retained, 'utf8');
  return [...seen].sort();
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const movedKeys = migrateLocalServerEnvironment(process.cwd());
  process.stdout.write(`[local-env] moved server-only keys to .dev.vars: ${movedKeys.join(', ')}\n`);
}
