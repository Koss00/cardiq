/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection',       value: '1; mode=block' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.clerk.com https://www.google.com https://www.gstatic.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://i.ebayimg.com https://img.clerk.com",
      "connect-src 'self' https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
      "frame-src https://accounts.google.com https://www.google.com https://accounts.facebook.com https://clerk.accounts.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ebayimg.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Cache GET API responses that change infrequently
      {
        source: '/api/portfolio/metrics',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=3600, stale-while-revalidate=7200' }],
      },
      {
        source: '/api/alerts',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=60, stale-while-revalidate=120' }],
      },
      {
        source: '/api/portfolio',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=15, stale-while-revalidate=30' }],
      },
    ];
  },
};

export default nextConfig;
