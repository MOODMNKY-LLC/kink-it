import { requireAuth } from "@/lib/auth/get-user"
import { KinkyKincadePlayground } from "@/components/playground/kinky-kincade/kinky-kincade-playground"

/**
 * Scene Builder Page
 * 
 * Unified image generation interface combining:
 * - Props-based generation
 * - Prompt-based generation
 * - Image editing
 * - Scene composition
 * - Pose variation
 * 
 * All in one streamlined, mobile-friendly interface.
 */
export default async function SceneBuilderPage() {
  await requireAuth()

  return (
    <div className="h-screen w-full overflow-hidden">
      <KinkyKincadePlayground />
    </div>
  )
}


