/**
 * Utility functions for Supabase Storage image transformations
 * Provides helper functions to generate optimized image URLs
 */

/**
 * Get optimized image URL from Supabase Storage with transformations
 * 
 * @param imageUrl - Full Supabase Storage URL or storage path (bucket/path)
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    resize?: 'cover' | 'contain' | 'fill'
  } = {}
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL not configured, returning original URL")
    return imageUrl
  }

  // Parse project ID from Supabase URL
  const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
  const projectId = urlMatch ? urlMatch[1] : null

  if (!projectId) {
    console.warn("Could not parse project ID from Supabase URL, returning original URL")
    return imageUrl
  }

  // If src is already a full URL, extract the storage path
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    // Check if it's a Supabase Storage URL
    if (imageUrl.includes("supabase.co/storage/v1/object/public")) {
      // Extract bucket and path from URL
      const pathMatch = imageUrl.match(/\/storage\/v1\/object\/public\/(.+)$/)
      if (pathMatch) {
        const storagePath = pathMatch[1]
        return buildTransformationUrl(projectId, storagePath, options)
      }
    }
    // For non-Supabase URLs, return as-is
    return imageUrl
  }

  // For relative paths (e.g., "bucket/path/to/image.png")
  return buildTransformationUrl(projectId, imageUrl, options)
}

/**
 * Build Supabase Image Transformation URL
 */
function buildTransformationUrl(
  projectId: string,
  storagePath: string,
  options: {
    width?: number
    height?: number
    quality?: number
    resize?: 'cover' | 'contain' | 'fill'
  }
): string {
  const params = new URLSearchParams()

  if (options.width) {
    params.append('width', options.width.toString())
  }
  if (options.height) {
    params.append('height', options.height.toString())
  }
  if (options.quality) {
    params.append('quality', options.quality.toString())
  }
  if (options.resize) {
    params.append('resize', options.resize)
  }

  const queryString = params.toString()
  return `https://${projectId}.supabase.co/storage/v1/render/image/public/${storagePath}${queryString ? `?${queryString}` : ''}`
}

/**
 * Get thumbnail URL for an image
 */
export function getThumbnailUrl(imageUrl: string, size: number = 200): string {
  return getOptimizedImageUrl(imageUrl, {
    width: size,
    height: size,
    quality: 60,
    resize: 'cover',
  })
}

/**
 * Get responsive image URLs for different viewport sizes
 */
export function getResponsiveImageUrls(imageUrl: string): {
  mobile: string
  tablet: string
  desktop: string
  full: string
} {
  return {
    mobile: getOptimizedImageUrl(imageUrl, { width: 400, quality: 75 }),
    tablet: getOptimizedImageUrl(imageUrl, { width: 800, quality: 80 }),
    desktop: getOptimizedImageUrl(imageUrl, { width: 1200, quality: 85 }),
    full: imageUrl, // Original URL for full-size display
  }
}
