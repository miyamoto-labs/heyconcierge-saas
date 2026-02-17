/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle pdf-parse — let Node.js require it at runtime
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'pdf-parse']
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
