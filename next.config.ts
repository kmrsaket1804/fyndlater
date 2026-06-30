import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';

const require = createRequire(import.meta.url);

function getFfmpegTraceIncludes(): string[] {
  const includes = new Set<string>([
    './node_modules/ffmpeg-static/ffmpeg',
    './node_modules/ffmpeg-static/ffmpeg.LICENSE',
    './node_modules/.pnpm/ffmpeg-static@*/node_modules/ffmpeg-static/ffmpeg',
    './node_modules/.pnpm/ffmpeg-static@*/node_modules/ffmpeg-static/ffmpeg.LICENSE',
  ]);

  try {
    const pkgPath = require.resolve('ffmpeg-static/package.json');
    const dir = path.dirname(pkgPath);
    const binary = path.join(dir, 'ffmpeg');
    if (existsSync(binary)) {
      includes.add(path.relative(process.cwd(), binary));
    }
  } catch {
    // ffmpeg-static not installed yet (postinstall runs after install)
  }

  return [...includes];
}

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/queues/process-reel': getFfmpegTraceIncludes(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    ppr: true,
    clientSegmentCache: true,
  },
};

export default nextConfig;
