/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude mysql2 from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        mysql2: false,
      };
    }

    return config;
  },
  
  // Server external packages
  serverExternalPackages: ['mysql2', 'bcryptjs'],

  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Image optimization
  images: {
    domains: ['localhost'],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/manager',
        destination: '/manager/cabinet-1',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
