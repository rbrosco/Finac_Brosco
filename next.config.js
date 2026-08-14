/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['typeorm', 'pg', 'bcryptjs'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'typeorm', 'pg-native'];
    return config;
  },
};

module.exports = nextConfig;
