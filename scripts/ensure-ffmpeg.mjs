import { createRequire } from 'node:module';
import { copyFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const require = createRequire(import.meta.url);
const bundledDir = path.join(process.cwd(), 'lib/reel-pipeline/bin');
const bundledBinary = path.join(bundledDir, 'ffmpeg');

try {
  const pkgPath = require.resolve('ffmpeg-static/package.json');
  const dir = path.dirname(pkgPath);
  const binaryName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const packageBinary = path.join(dir, binaryName);

  if (!existsSync(packageBinary)) {
    console.log('[ensure-ffmpeg] Downloading ffmpeg-static binary...');
    execSync('node install.js', { cwd: dir, stdio: 'inherit' });
  }

  if (!existsSync(packageBinary)) {
    throw new Error(`Expected binary missing after install: ${packageBinary}`);
  }

  mkdirSync(bundledDir, { recursive: true });
  copyFileSync(packageBinary, bundledBinary);
  chmodSync(bundledBinary, 0o755);

  console.log('[ensure-ffmpeg] Bundled ffmpeg at', bundledBinary);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[ensure-ffmpeg] Failed:', message);
  process.exit(1);
}
