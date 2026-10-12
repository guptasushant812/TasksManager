import type { NextConfig } from "next";
import path from "path";

const rawBackend = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:4000'
).trim();

const backendBase = rawBackend.replace(/\/+$/, '').replace(/\/api$/, '');
const destination = `${backendBase}/api/:path*`;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [];
  },
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination,
      },
    ];
  },
};

export default nextConfig;
