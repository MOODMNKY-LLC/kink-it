import { requireAuth } from "@/lib/auth/get-user"
import { ImageStudio } from "@/components/playground/image-studio/image-studio"

/**
 * Image Studio Page
 * 
 * Unified image generation interface combining:
 * - Props-based generation
 * - Prompt-based generation
 * - Image editing
 * - Scene composition
 * - Kinkster creator
 * - Preset management
 * 
 * All image generation features in one place.
 */
export default async function ImageStudioPage() {
  await requireAuth()

  return (
    <div className="h-screen w-full overflow-hidden">
      <ImageStudio />
    </div>
  )
}
