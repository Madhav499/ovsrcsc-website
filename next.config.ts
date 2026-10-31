import type { NextConfig } from 'next';
import { LEGACY_REDIRECTS } from './src/lib/legacy-redirects';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ['argon2'],
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/', destination: '/en', permanent: false },
      ...Object.entries(LEGACY_REDIRECTS).map(([source, destination]) => ({
        source,
        destination,
        permanent: !['/home-page-2', '/maintenance'].includes(source),
      })),
    ];
  },
};

export default nextConfig;
