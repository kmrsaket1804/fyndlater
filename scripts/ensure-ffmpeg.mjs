import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const require = createRequire(import.meta.url);

try {
  const pkgPath = require.resolve('ffmpeg-static/package.json');
  const dir = path.dirname(pkgPath);
  const binaryName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const binaryPath = path.join(dir, binaryName);

  if (existsSync(binaryPath)) {
    console.log('[ensure-ffmpeg] Binary already present at', binaryPath);
    process.exit(0);
  }

  console.log('[ensure-ffmpeg] Downloading ffmpeg-static binary...');
  execSync('node install.js', { cwd: dir, stdio: 'inherit' });

  if (!existsSync(binaryPath)) {
    throw new Error(`Expected binary missing after install: ${binaryPath}`);
  }

  console.log('[ensure-ffmpeg] Ready at', binaryPath);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[ensure-ffmpeg] Failed:', message);
  process.exit(1);
}
