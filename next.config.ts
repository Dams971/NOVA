import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // WARNING: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
    dirs: ['src']
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true
  },
  // Optimize build
  swcMinify: true,
  reactStrictMode: true,
  // Reduce build memory usage
  experimental: {
    // Reduce memory usage during build
    workerThreads: false,
    cpus: 1
  },
  // Disable image optimization during build to speed up
  images: {
    unoptimized: true
  },
  // Output standalone for better performance
  output: 'standalone'
};

export default nextConfig;
