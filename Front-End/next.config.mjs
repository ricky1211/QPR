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
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  images: {
    qualities: [75, 90],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/qpr/',
        basePath: false,
        permanent: false,
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

