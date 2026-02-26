/** @type {import('next').NextConfig} */
const nextConfig = {
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
