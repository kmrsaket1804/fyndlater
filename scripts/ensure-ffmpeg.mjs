import { createRequire } from 'node:module';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  chmodSync,
  rmSync,
} from 'node:fs';
import { execSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const bundledDir = path.join(process.cwd(), 'lib/reel-pipeline/bin');

function normalizeArch(arch) {
  if (arch === 'amd64') return 'x64';
  return arch;
}

function bundledName(platform, arch) {
  return `ffmpeg-${platform}-${normalizeArch(arch)}`;
}

function installTargets() {
  if (process.env.VERCEL === '1' || process.env.CI === 'true') {
    // Vercel queue consumers may run x86_64 or arm64 — bundle both Linux builds.
    return [
      { platform: 'linux', arch: 'x64' },
      { platform: 'linux', arch: 'arm64' },
    ];
  }

  return [
    {
      platform: process.env.npm_config_platform || os.platform(),
      arch: normalizeArch(process.env.npm_config_arch || os.arch()),
    },
  ];
}

function installFfmpegForTarget(platform, arch) {
  const pkgPath = require.resolve('ffmpeg-static/package.json');
  const dir = path.dirname(pkgPath);
  const packageBinary = path.join(
    dir,
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  );

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

  if (!existsSync(packageBinary)) {
    throw new Error(`Expected binary missing after install: ${packageBinary}`);
  }

  mkdirSync(bundledDir, { recursive: true });
  const dest = path.join(bundledDir, bundledName(platform, arch));
  copyFileSync(packageBinary, dest);
  chmodSync(dest, 0o755);
  console.log('[ensure-ffmpeg] Bundled ffmpeg at', dest);
  return dest;
}

try {
  const installed = installTargets().map(({ platform, arch }) =>
    installFfmpegForTarget(platform, arch)
  );

  // Legacy single-path alias for local tooling.
  const primary = installed[installed.length - 1];
  const legacy = path.join(bundledDir, 'ffmpeg');
  copyFileSync(primary, legacy);
  chmodSync(legacy, 0o755);
  console.log('[ensure-ffmpeg] Legacy alias at', legacy);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[ensure-ffmpeg] Failed:', message);
  process.exit(1);
}
