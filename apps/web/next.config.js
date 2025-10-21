const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101',
  },
  // Enable standalone output for optimized Docker builds
  output: 'standalone',

  // PWA Configuration
  // Service Worker is handled via public/sw.js and registered in layout.tsx

  images: {
    // Modern image format support with priority to AVIF (better compression)
    formats: ['image/avif', 'image/webp'],
    // Responsive images optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable image optimization with longer cache TTL
    minimumCacheTTL: 86400, // 24 hours (increased from 60 seconds)
    // Unoptimized for better performance in development
    unoptimized: process.env.NODE_ENV === 'development',
    // Dangerously allow SVG for better icon performance
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: 'filesystem.site',
      },
      {
        protocol: 'https',
        hostname: 'asyncdata.net',
      },
    ],
  },

  // Performance optimization - Code splitting and lazy loading
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query', 'zustand'],
    // Enable strict mode for better performance
    strictNextHead: true,
    // Temporarily disable these features for debugging
    // optimizeCss: true,
    // webpackBuildWorker: true,
  },
  // Bundle optimization with SWC
  compiler: {
    // removeConsole is not supported by Turbopack
    // removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    // Enable SWC minification (faster than Terser)
    styledComponents: false,
  },
  // Use SWC minifier for better performance
  swcMinify: true,
  // Production source maps for debugging (disable for smaller builds)
  productionBrowserSourceMaps: false,
  // Compression
  compress: true,
  // Power optimization
  poweredByHeader: false,
  // Advanced Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          // Reduce max initial requests for better HTTP/2 performance
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          // Smaller chunks for better caching
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // React/React-DOM in separate chunk (highest priority)
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Large UI libraries in separate chunks
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/,
              chunks: 'all',
              priority: 35,
              enforce: true,
              reuseExistingChunk: true,
            },
            // State management libraries
            state: {
              name: 'state',
              test: /[\\/]node_modules[\\/](zustand|@tanstack\/react-query)[\\/]/,
              chunks: 'all',
              priority: 30,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Form libraries
            forms: {
              name: 'forms',
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform\/resolvers|zod)[\\/]/,
              chunks: 'all',
              priority: 28,
              enforce: true,
              reuseExistingChunk: true,
            },
            // HTTP client
            http: {
              name: 'http',
              test: /[\\/]node_modules[\\/](axios)[\\/]/,
              chunks: 'all',
              priority: 26,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Vendor chunk for remaining node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunk for shared components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
        // Enable module concatenation (scope hoisting)
        concatenateModules: true,
        // Enable tree shaking
        usedExports: true,
        // Minimize code in production
        minimize: !dev,
        // Better runtime chunk configuration
        runtimeChunk: {
          name: 'runtime',
        },
        // Enable SideEffects optimization
        sideEffects: true,
      }

      // Improve module resolution performance
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          // Prevent duplicate React instances (only in production)
          // Note: Commented out for pnpm compatibility
          // 'react': require.resolve('react'),
          // 'react-dom': require.resolve('react-dom'),
        },
        // Speed up module resolution (disabled for pnpm compatibility)
        // symlinks: false,
      }

      // Performance hints
      config.performance = {
        hints: dev ? false : 'warning',
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      }
    }

    // Enable webpack cache for faster rebuilds
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      // Compression for smaller cache
      compression: 'gzip',
    }

    // Optimize production builds
    if (!dev) {
      // Enable aggressive module caching
      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
        immutablePaths: [],
        buildDependencies: {
          timestamp: true,
        },
      }
    }

    return config
  },

  // Additional headers for better caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
