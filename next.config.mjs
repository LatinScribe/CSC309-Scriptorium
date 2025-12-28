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
  allowedDevOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3011', 'https://scriptorium.henrytchen.com', 'https://www.scriptorium.henrytchen.com'], 
};

export default nextConfig;
