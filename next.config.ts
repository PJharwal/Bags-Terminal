import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16 default)
  turbopack: {
    root: process.cwd(),
  },
  // Webpack fallback for Solana wallet adapter polyfills (used with --webpack flag)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      buffer: false,
      process: false,
    };
    return config;
  },
};

export default nextConfig;
