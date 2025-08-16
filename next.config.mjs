import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimizations for Vercel
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@mui/material',
      'recharts',
      'framer-motion',
      'date-fns'
    ],
    // Reduce memory usage during build
    workerThreads: false,
    cpus: 1
  },
  
  // ESLint configuration
  eslint: {
    // Allow production builds even with ESLint errors
    ignoreDuringBuilds: true,
    dirs: ['src']
  },
  
  // TypeScript configuration
  typescript: {
    // Allow production builds even with TypeScript errors
    ignoreBuildErrors: true
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'nova-rdv.dz'],
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/avif', 'image/webp']
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': join(__dirname, 'src')
    };
    
    // Ignore certain modules for client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        querystring: false,
        path: false,
        os: false,
        util: false,
        buffer: false
      };
    }
    
    return config;
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },
  
  // Redirects for old routes
  async redirects() {
    return [
      {
        source: '/appointments',
        destination: '/rdv',
        permanent: true
      }
    ];
  },
  
  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080'
  },
  
  // Output configuration
  output: 'standalone',
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Generate build ID
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`;
  }
};

export default nextConfig;