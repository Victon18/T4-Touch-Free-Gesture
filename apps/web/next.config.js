/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/db'],
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
