import { requireAuth } from "@/lib/auth/get-user"
import { CreativeStudio } from "@/components/playground/creative-studio"

/**
 * Creative Studio Page
 *
 * Unified creative suite combining:
 * - Props-based image generation
 * - Prompt-based image generation
 * - Image editing
 * - Pose variation
 * - Scene composition
 * - KINKSTER character creation
 * - Generation library
 *
 * All in one streamlined, mobile-friendly interface.
 */
export default async function CreativeStudioPage() {
  await requireAuth()

  return (
    <div className="h-screen w-full overflow-hidden">
      <CreativeStudio />
    </div>
  )
}
