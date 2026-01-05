import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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

export default nextConfig
