import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // WARNING: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    // This is temporarily enabled to allow deployment with warnings
    ignoreDuringBuilds: true,
    dirs: ['src']
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // Only set to true temporarily to deploy with warnings
    ignoreBuildErrors: false
  }
};

export default nextConfig;
