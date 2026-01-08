import type { NextConfig } from "next"
import path from "path"

// Bundle analyzer (optional - only when ANALYZE=true)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({
      enabled: true,
    })
  : (config: NextConfig) => config

const nextConfig: NextConfig = {
  // Set output file tracing root to prevent Next.js from detecting nested lockfiles
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip static generation for error pages (Next.js 15.5.9 bug with Html import)
  // Production works fine with runtime rendering
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Externalize packages with native dependencies for server components and API routes
  serverExternalPackages: [
    '@imgly/background-removal-node',
    '@imgly/vectorizer',
  ],
  images: {
    // Use custom Supabase loader for image transformations
    loader: 'custom',
    loaderFile: './lib/supabase-image-loader.ts',
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
      // Supabase Storage (production)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Local development (Supabase local instance)
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        port: '55321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '55321',
        pathname: '/storage/v1/object/public/**',
      },
      // Local development (HTTP fallback)
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '55321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '55321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Only apply webpack config when not using Turbopack
    // Turbopack has its own bundling system and doesn't use webpack
    if (process.env.TURBOPACK === '1' || process.env.TURBOPACK === 'true') {
      return config
    }

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

    // Externalize image processing libraries for Node.js API routes
    // These packages have native dependencies and should not be bundled
    // Note: serverExternalPackages handles this for Turbopack
    if (isServer) {
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push({
          '@imgly/background-removal-node': 'commonjs @imgly/background-removal-node',
          '@imgly/vectorizer': 'commonjs @imgly/vectorizer',
        })
      } else if (typeof config.externals === 'object') {
        config.externals['@imgly/background-removal-node'] = 'commonjs @imgly/background-removal-node'
        config.externals['@imgly/vectorizer'] = 'commonjs @imgly/vectorizer'
      }
    }

    return config
  },
}

export default withBundleAnalyzer(nextConfig)
