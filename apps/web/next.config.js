/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  outputFileTracingIncludes: {
    '/*': ['../../packages/database/generated/prisma/**/*'],
  },
};

export default nextConfig;
