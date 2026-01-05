/**
 * Custom Next.js Image loader for Supabase Storage
 * Enables image optimization and transformation via Supabase Image Transformation API
 * 
 * Usage:
 * import Image from 'next/image'
 * import supabaseImageLoader from '@/lib/supabase-image-loader'
 * 
 * <Image
 *   loader={supabaseImageLoader}
 *   src="user_id/kinksters/avatar_123.png"
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

  // If src is already a full URL, use it directly
  if (src.startsWith("http://") || src.startsWith("https://")) {
    // Check if it's a Supabase Storage URL
    if (src.includes("supabase.co/storage/v1/object/public")) {
      // Extract path from URL and apply transformation
      const pathMatch = src.match(/\/storage\/v1\/object\/public\/(.+)$/)
      if (pathMatch) {
        const storagePath = pathMatch[1]
        return `https://${projectId}.supabase.co/storage/v1/object/public/${storagePath}?width=${width}&quality=${quality}`
      }
    }
    // For non-Supabase URLs, return as-is (e.g., OpenAI temporary URLs)
    return src
  }

  // For relative paths (e.g., "user_id/kinksters/avatar.png")
  // Construct Supabase Storage public URL with transformation
  const bucket = "kinkster-avatars"
  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${src}?width=${width}&quality=${quality}`
}

