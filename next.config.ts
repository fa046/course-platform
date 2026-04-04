import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.app.github.dev', '*.vercel.app'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
      },
    ],
  },
}

export default nextConfig