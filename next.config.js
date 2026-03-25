/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist', 'mammoth'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdf-parse has native bindings — keep it external so Node.js loads it at runtime
      // otplib and qrcode are pure JS — let webpack bundle them normally
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'pdf-parse', 'canvas']
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}
module.exports = nextConfig
