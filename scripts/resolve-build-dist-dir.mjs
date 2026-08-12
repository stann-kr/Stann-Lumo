import process from 'node:process';

export function resolveBuildDistDir(environment) {
  if (environment.NEXT_DIST_DIR) return environment.NEXT_DIST_DIR;
  return environment.WORKERS_CI ? '.next' : '.next-build';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(resolveBuildDistDir(process.env));
}
