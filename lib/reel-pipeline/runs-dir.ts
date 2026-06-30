import path from 'node:path';

export function getRunsDir(): string {
  if (process.env.RUNS_DIR) return process.env.RUNS_DIR;
  if (process.env.VERCEL) return path.join('/tmp', 'reel-runs');
  return '.runs';
}
