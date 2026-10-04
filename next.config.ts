import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
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
