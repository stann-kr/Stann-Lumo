import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep local development and the standard production build from mutating the
  // same output directory when they run at the same time.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  poweredByHeader: false,
};

export default nextConfig;
