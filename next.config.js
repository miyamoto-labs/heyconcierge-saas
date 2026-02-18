/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'otplib', 'qrcode'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these — let Node.js require them at runtime
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'pdf-parse', 'otplib', 'qrcode']
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
