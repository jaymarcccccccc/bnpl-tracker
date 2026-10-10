// The browser talks to /api/* on the Next.js server, which forwards to FastAPI.
// This avoids CORS and keeps the backend URL out of client code.
const API_URL = process.env.API_URL || "http://localhost:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
