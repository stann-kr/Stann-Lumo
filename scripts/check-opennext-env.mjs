import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parse } from '@dotenvx/dotenvx';

export const ALLOWED_OPENNEXT_ENV_KEYS = new Set([
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_TERMINAL_URL',
  'NEXT_PUBLIC_HUB_URL',
  'NEXT_PUBLIC_FORM_ENDPOINT',
]);

const OPENNEXT_MODES = ['production', 'development', 'test'];

function getModeFileNames(mode) {
  return [
    '.env',
    `.env.${mode}`,
    ...(mode !== 'test' ? ['.env.local'] : []),
    `.env.${mode}.local`,
  ];
}

function unsafeKeys(record) {
  return Object.keys(record).filter((key) => !ALLOWED_OPENNEXT_ENV_KEYS.has(key));
}

export function inspectOpenNextEnvSources(rootDirectory) {
  const issues = [];
  const inspectedFiles = new Set();

  for (const mode of OPENNEXT_MODES) {
    for (const fileName of getModeFileNames(mode)) {
      const filePath = path.resolve(rootDirectory, fileName);
      if (inspectedFiles.has(filePath) || !fs.existsSync(filePath)) continue;
      inspectedFiles.add(filePath);

      let parsed;
      try {
        parsed = parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        issues.push({ filePath, key: '<parse-error>' });
        continue;
      }

      for (const key of unsafeKeys(parsed)) {
        issues.push({ filePath, key });
      }
    }
  }

  return issues;
}

export function parseOpenNextEnvArtifact(source) {
  const environments = {};
  const exportPattern = /^export const (production|development|test) = (.*);$/gm;

  for (const match of source.matchAll(exportPattern)) {
    const mode = match[1];
    const json = match[2];
    if (!mode || !json) continue;
    environments[mode] = JSON.parse(json);
  }

  return environments;
}

export function inspectOpenNextEnvArtifact(artifactPath) {
  if (!fs.existsSync(artifactPath)) {
    return [{ filePath: artifactPath, key: '<missing-artifact>' }];
  }

  let environments;
  try {
    environments = parseOpenNextEnvArtifact(fs.readFileSync(artifactPath, 'utf8'));
  } catch {
    return [{ filePath: artifactPath, key: '<parse-error>' }];
  }

  const issues = [];
  for (const mode of OPENNEXT_MODES) {
    const values = environments[mode];
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      issues.push({ filePath: artifactPath, key: `<missing-${mode}-export>` });
      continue;
    }

    for (const key of unsafeKeys(values)) {
      issues.push({ filePath: artifactPath, key: `${mode}:${key}` });
    }
  }

  return issues;
}

export function formatOpenNextEnvIssues(issues, rootDirectory = process.cwd()) {
  return issues
    .map(({ filePath, key }) => {
      const relativePath = path.relative(rootDirectory, filePath) || path.basename(filePath);
      return `[opennext-env] rejected ${relativePath}: ${key}`;
    })
    .join('\n');
}

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

export function runOpenNextEnvCheck(args = process.argv.slice(2)) {
  const mode = args[0] ?? 'source';
  const rootDirectory = path.resolve(readOption(args, '--root', process.cwd()));
  const artifactPath = path.resolve(
    readOption(
      args,
      '--artifact',
      path.join(rootDirectory, '.open-next/cloudflare/next-env.mjs'),
    ),
  );

  const issues = mode === 'artifact'
    ? inspectOpenNextEnvArtifact(artifactPath)
    : inspectOpenNextEnvSources(rootDirectory);

  if (issues.length > 0) {
    process.stderr.write(`${formatOpenNextEnvIssues(issues, rootDirectory)}\n`);
    return 1;
  }

  process.stdout.write(`[opennext-env] ${mode} key allowlist PASS\n`);
  return 0;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  process.exitCode = runOpenNextEnvCheck();
}
