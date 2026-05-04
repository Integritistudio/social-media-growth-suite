/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  images: {
    domains: ['oaidalleapiprodscus.blob.core.windows.net', 'graph.instagram.com'],
  },
};

module.exports = nextConfig;
