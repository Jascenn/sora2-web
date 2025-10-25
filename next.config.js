/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101',
  },
  // 暂时禁用 standalone 模式
  // output: 'standalone',

  images: {
    formats: ['image/webp'],
    unoptimized: true, // 开发环境禁用优化
  },

  // 简化配置
  compiler: {
    styledComponents: false,
  },

  swcMinify: false, // 开发环境禁用压缩

  webpack: (config, { isServer, dev }) => {
    if (!isServer && dev) {
      // 开发环境简化配置
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
        },
      }
    }
    return config
  },
}

module.exports = nextConfig