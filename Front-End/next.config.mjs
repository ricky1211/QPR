import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

const cleanBackendUrl = BACKEND_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/qpr',
  trailingSlash: true,
  images: {
    qualities: [75, 90],
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/qpr/',
        permanent: false,
        basePath: false,
      },
      {
        source: '/favicon.ico',
        destination: '/qpr/favicon.ico',
        permanent: false,
        basePath: false,
      },
      {
        source: '/apple-touch-icon.png',
        destination: '/qpr/logo-mtm-icon.png',
        permanent: false,
        basePath: false,
      },
      {
        source: '/apple-touch-icon-precomposed.png',
        destination: '/qpr/logo-mtm-icon.png',
        permanent: false,
        basePath: false,
      },
      {
        source: '/:asset.:ext(png|jpg|jpeg|svg|ico|webp)',
        destination: '/qpr/:asset.:ext',
        permanent: false,
        basePath: false,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/qpr/api/:path*',
        destination: `${cleanBackendUrl}/api/:path*`,
        basePath: false,
      },
      {
        source: '/api/:path*',
        destination: `${cleanBackendUrl}/api/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;

