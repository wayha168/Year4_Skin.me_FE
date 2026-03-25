import type { NextConfig } from 'next'

// Backend URL only in server config – not exposed to client (no NEXT_PUBLIC_)
const BACKEND_URL = process.env.BACKEND_URL || 'https://backend.skinme.store'

const nextConfig: NextConfig = {
  images: {
    qualities: [70, 75, 85],
    remotePatterns: [
      { protocol: 'https', hostname: new URL(BACKEND_URL).hostname },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${BACKEND_URL}/api/v1/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
      {
        source: '/api/chatbot/:path*',
        destination: 'https://chatbot.skinme.store/:path*',
      },
    ]
  },
}

export default nextConfig