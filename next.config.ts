import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    '/api/queues/process-reel': [
      './lib/reel-pipeline/bin/ffmpeg-linux-x64',
      './lib/reel-pipeline/bin/ffmpeg-linux-arm64',
      './lib/reel-pipeline/bin/ffmpeg',
    ],
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
