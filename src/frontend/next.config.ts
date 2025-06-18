import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'api.degenie.ai'],
  },
  // Skip static generation for pages with wallet dependencies
  trailingSlash: false,
  output: 'standalone',
};

export default nextConfig;
