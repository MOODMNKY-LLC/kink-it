/**
 * Custom Next.js Image loader for Supabase Storage
 * Enables image optimization and transformation via Supabase Image Transformation API
 * 
 * Uses the /render/image/public/ endpoint for on-the-fly transformations
 * 
 * Usage:
 * import Image from 'next/image'
 * import supabaseImageLoader from '@/lib/supabase-image-loader'
 * 
 * <Image
 *   loader={supabaseImageLoader}
 *   src="bucket/path/to/image.png" // or full Supabase Storage URL
 *   width={512}
 *   height={512}
 *   alt="Avatar"
 * />
 */

interface LoaderProps {
  src: string
  width: number
  quality?: number
}

export default function supabaseImageLoader({ src, width, quality = 75 }: LoaderProps): string {
  // Handle local static images (starting with /)
  // Next.js requires the width parameter to be included in the returned URL
  // Even though static files don't use it, we include it as a query parameter to satisfy Next.js
  if (src.startsWith("/") && !src.startsWith("//")) {
    // Include width and quality in query string to satisfy Next.js loader requirements
    // The static file server will ignore these parameters, but Next.js needs them for optimization tracking
    const separator = src.includes("?") ? "&" : "?"
    return `${src}${separator}w=${width}&q=${quality}`
  }

  // Extract project ID from environment variable
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL not configured, using src as-is")
    return src
  }

  // Parse project ID from Supabase URL
  // Format: https://{project_id}.supabase.co
  const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
  const projectId = urlMatch ? urlMatch[1] : null

  if (!projectId) {
    console.warn("Could not parse project ID from Supabase URL, using src as-is")
    return src
  }

  // If src is already a full URL, extract the storage path
  if (src.startsWith("http://") || src.startsWith("https://")) {
    // Check if it's a Supabase Storage URL
    if (src.includes("supabase.co/storage/v1/object/public")) {
      // Extract bucket and path from URL
      // Format: /storage/v1/object/public/{bucket}/{path}
      const pathMatch = src.match(/\/storage\/v1\/object\/public\/(.+)$/)
      if (pathMatch) {
        const storagePath = pathMatch[1]
        // Use the render/image endpoint for transformations
        return `https://${projectId}.supabase.co/storage/v1/render/image/public/${storagePath}?width=${width}&quality=${quality}`
      }
    }
    // For non-Supabase URLs, return as-is (e.g., OpenAI temporary URLs, blob URLs)
    return src
  }

  // For relative paths (e.g., "bucket/path/to/image.png")
  // Construct Supabase Storage transformation URL
  // Use the render/image endpoint for transformations
  return `https://${projectId}.supabase.co/storage/v1/render/image/public/${src}?width=${width}&quality=${quality}`
}



