/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dividdy/shared-types'],
  output: 'standalone',
};

module.exports = nextConfig;

