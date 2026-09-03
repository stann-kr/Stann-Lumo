import path from 'node:path';
import process from 'node:process';

const TARGETS = {
  dev: { branch: 'dev', label: 'development' },
  production: { branch: 'main', label: 'production' },
  preview: { label: 'development preview' },
};

function isCommitSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);
}

export function validateCloudflareDeployTarget(target, environment) {
  const specification = TARGETS[target];
  if (!specification) {
    return { ok: false, message: `Unknown Cloudflare deploy target: ${target || '<missing>'}` };
  }

  const branch = environment.WORKERS_CI_BRANCH;
  const commitSha = environment.WORKERS_CI_COMMIT_SHA;
  if (environment.WORKERS_CI === '1') {
    if (!isCommitSha(commitSha)) {
      return { ok: false, message: 'Workers Builds must provide a full WORKERS_CI_COMMIT_SHA.' };
    }

    if (target === 'preview') {
      if (!branch || branch === 'dev' || branch === 'main') {
        return { ok: false, message: 'Development previews only accept non-dev, non-main branches.' };
      }
    } else if (branch !== specification.branch) {
      return {
        ok: false,
        message: `${specification.label} deploy requires the ${specification.branch} branch, received ${branch || '<missing>'}.`,
      };
    }

    return { ok: true, mode: 'workers-builds', branch, commitSha };
  }

  if (target === 'dev' && environment.ALLOW_MANUAL_CLOUDFLARE_DEPLOY === 'dev') {
    return { ok: true, mode: 'manual-development-bootstrap', branch: null, commitSha: null };
  }

  return {
    ok: false,
    message: `${specification.label} deploy is restricted to its Workers Builds branch trigger.`,
  };
}

export function runCloudflareDeployTargetCheck(
  target = process.argv[2],
  environment = process.env,
) {
  const result = validateCloudflareDeployTarget(target, environment);
  if (!result.ok) {
    process.stderr.write(`[cloudflare-deploy] BLOCKED: ${result.message}\n`);
    return 1;
  }

  const revision = result.commitSha ? ` at ${result.commitSha.slice(0, 12)}` : '';
  process.stdout.write(`[cloudflare-deploy] PASS: ${TARGETS[target].label} via ${result.mode}${revision}\n`);
  return 0;
}

const currentFile = new URL(import.meta.url).pathname;
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  process.exitCode = runCloudflareDeployTargetCheck();
}
