import type { NextConfig } from "next"

// Bundle analyzer (optional - only when ANALYZE=true)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({
      enabled: true,
    })
  : (config: NextConfig) => config

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable Next.js image optimization for better performance
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 80, 85, 90, 95, 100], // Support quality 90 for Next.js 16 compatibility
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3-us-west-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.notion.so',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'public.notion-static.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize webpack cache strategy to reduce serialization warnings
    // Note: Next.js already handles filesystem caching, we just optimize settings
    if (config.cache && typeof config.cache === 'object') {
      // Preserve existing cache config but optimize compression
      config.cache = {
        ...config.cache,
        // Optimize cache compression if supported
        ...(config.cache.type === 'filesystem' && {
          compression: 'gzip',
        }),
      }
    }

    // Optimize module resolution for better performance
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
    }

    return config
  },
}

export default withBundleAnalyzer(nextConfig)
