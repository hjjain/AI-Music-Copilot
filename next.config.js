/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server actions for form submissions
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Allow images from external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: '*.replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'cdn1.suno.ai',
      },
      {
        protocol: 'https',
        hostname: 'cdn2.suno.ai',
      },
    ],
  },
  // Increase API timeout for long-running operations
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
