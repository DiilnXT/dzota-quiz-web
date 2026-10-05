import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    cpus: 4,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/api/home',
        },
        {
          source: '/creator',
          destination: '/api/creator',
        }
      ],
      afterFiles: [],
      fallback: []
    }
  },
};

export default nextConfig;
