/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/:path*', // Match all routes
        destination: '/',  // Redirect them to the SPA entry point
      },
    ];
  },
};

export default nextConfig;
