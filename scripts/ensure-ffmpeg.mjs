import { createRequire } from 'node:module';
import { copyFileSync, existsSync, mkdirSync, chmodSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const bundledDir = path.join(process.cwd(), 'lib/reel-pipeline/bin');
const bundledBinary = path.join(bundledDir, 'ffmpeg');

function getTargetPlatformArch() {
  // Vercel Functions default to linux arm64 — download matching ffmpeg.
  if (process.env.VERCEL) {
    return { platform: 'linux', arch: 'arm64' };
  }

  return {
    platform: process.env.npm_config_platform || os.platform(),
    arch: process.env.npm_config_arch || os.arch(),
  };
}

try {
  const pkgPath = require.resolve('ffmpeg-static/package.json');
  const dir = path.dirname(pkgPath);
  const binaryName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const packageBinary = path.join(dir, binaryName);
  const { platform, arch } = getTargetPlatformArch();

  const shouldInstall =
    process.env.VERCEL === '1' ||
    process.env.CI === 'true' ||
    !existsSync(packageBinary);

  if (shouldInstall) {
    if (existsSync(packageBinary)) {
      rmSync(packageBinary);
    }
    console.log(
      `[ensure-ffmpeg] Downloading ffmpeg for ${platform}/${arch}...`
    );
    execSync('node install.js', {
      cwd: dir,
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_platform: platform,
        npm_config_arch: arch,
      },
    });
  }

  if (!existsSync(packageBinary)) {
    throw new Error(`Expected binary missing after install: ${packageBinary}`);
  }

  mkdirSync(bundledDir, { recursive: true });
  copyFileSync(packageBinary, bundledBinary);
  chmodSync(bundledBinary, 0o755);

  console.log('[ensure-ffmpeg] Bundled ffmpeg at', bundledBinary, {
    target: `${platform}/${arch}`,
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[ensure-ffmpeg] Failed:', message);
  process.exit(1);
}
