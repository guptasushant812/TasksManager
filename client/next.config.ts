import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Disable strict CSP for local dev so Google Fonts loads
  async headers() {
    return [];
  },
  // Allow images from external sources if needed later
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Use 127.0.0.1 to avoid Windows IPv6 (::1) ECONNREFUSED issues
        destination: process.env.BACKEND_API_URL || 'http://127.0.0.1:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
