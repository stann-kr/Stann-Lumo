import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse } from '@dotenvx/dotenvx';

export const REMOTE_CLOUDFLARE_CREDENTIAL_KEYS = new Set([
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_API_KEY',
  'CLOUDFLARE_EMAIL',
  'CLOUDFLARE_ACCESS_CLIENT_ID',
  'CLOUDFLARE_ACCESS_CLIENT_SECRET',
  'CF_ACCOUNT_ID',
  'CF_API_TOKEN',
  'CF_API_KEY',
  'CF_EMAIL',
]);

export const LOCAL_WORKER_SOURCE_KEYS = new Set(['ADMIN_PASSWORD']);

export function selectLocalWorkerEnvironment(source) {
  let parsed;
  try {
    parsed = parse(source);
  } catch {
    return { error: '<parse-error>', values: {}, excludedKeys: [] };
  }

  const adminPassword = parsed.ADMIN_PASSWORD;
  if (typeof adminPassword !== 'string' || adminPassword.length === 0) {
    return { error: 'ADMIN_PASSWORD is required', values: {}, excludedKeys: [] };
  }

  return {
    error: null,
    values: {
      ADMIN_PASSWORD: adminPassword,
      MIGRATE_ENABLED: 'false',
      NEXTJS_ENV: 'development',
    },
    excludedKeys: Object.keys(parsed).filter((key) => !LOCAL_WORKER_SOURCE_KEYS.has(key)),
  };
}

export function serializeLocalWorkerEnvironment(values) {
  return Object.entries(values)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('\n') + '\n';
}

export function sanitizeLocalWorkerProcessEnvironment(environment) {
  const sanitized = { ...environment };
  for (const key of REMOTE_CLOUDFLARE_CREDENTIAL_KEYS) delete sanitized[key];
  sanitized.CLOUDFLARE_INCLUDE_PROCESS_ENV = 'false';
  return sanitized;
}

export function inspectLocalServerEnvironmentFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { error: '.dev.vars is required', values: {}, excludedKeys: [] };
  }
  return selectLocalWorkerEnvironment(fs.readFileSync(filePath, 'utf8'));
}

export function formatLocalServerEnvironmentError(error, filePath, rootDirectory = process.cwd()) {
  const relativePath = path.relative(rootDirectory, filePath) || path.basename(filePath);
  return `[local-server-env] invalid ${relativePath}: ${error}`;
}

export function runLocalServerEnvironmentCheck(args = process.argv.slice(2)) {
  const fileArgument = args.indexOf('--file');
  const fileName = fileArgument >= 0 && args[fileArgument + 1] ? args[fileArgument + 1] : '.dev.vars';
  const filePath = path.resolve(process.cwd(), fileName);
  const result = inspectLocalServerEnvironmentFile(filePath);

  if (result.error) {
    process.stderr.write(`${formatLocalServerEnvironmentError(result.error, filePath)}\n`);
    return 1;
  }

  process.stdout.write(
    `[local-server-env] allowlist PASS; excluded ${result.excludedKeys.length} disallowed key(s)\n`,
  );
  return 0;
}

const currentFile = new URL(import.meta.url).pathname;
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  process.exitCode = runLocalServerEnvironmentCheck();
}
