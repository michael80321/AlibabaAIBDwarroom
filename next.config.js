/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    serverActions: {
      allowedOrigins: ['warroom-production-b45b.up.railway.app'],
    },
  },
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
