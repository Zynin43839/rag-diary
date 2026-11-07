import type { NextConfig } from "next";

/**
 * The browser only ever talks to this Next.js origin. /api/* is proxied to the
 * Elysia server so the httpOnly session cookie stays first-party and works in
 * browsers that block third-party cookies.
 */
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ??
  (process.env.VERCEL
    ? "https://rag-diary-api.vercel.app"
    : "http://localhost:3001");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000','localhost:3001']
    }
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.blob.core.windows.net' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/:path*`,
      },
    ]
  },
};

export default nextConfig;
