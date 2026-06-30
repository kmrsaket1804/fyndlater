import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/queues/process-reel': ['./node_modules/ffmpeg-static/ffmpeg'],
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
    clientSegmentCache: true
  }
};

export default nextConfig;
