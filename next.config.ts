import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dashboard reads project files at request time; keep graphql on the server runtime.
  serverExternalPackages: ['graphql'],
};

export default nextConfig;
