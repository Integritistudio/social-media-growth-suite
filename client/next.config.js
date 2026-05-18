/** @type {import('next').NextConfig} */
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  images: {
    domains: ['oaidalleapiprodscus.blob.core.windows.net', 'graph.instagram.com'],
  },
};

module.exports = nextConfig;
