import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  redirects() {
    return [
      { source: '/properties', destination: '/plots', permanent: true },
      { source: '/properties/:slug', destination: '/plots/:slug', permanent: true },
      { source: '/projects', destination: '/layouts', permanent: true },
    ];
  },
};

export default nextConfig;
