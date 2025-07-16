/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for file uploads
  experimental: {
    serverActions: true,
  },
  // Configure static file serving from /public/uploads
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/public/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
