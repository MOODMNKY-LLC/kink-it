import { requireAuth } from "@/lib/auth/get-user"
import KinksterCreationWizard from "@/components/kinksters/kinkster-creation-wizard"

/**
 * KINKSTER Creator Page
 * 
 * Unified character creation and management interface.
 * Combines:
 * - Character creation wizard
 * - Character library/management
 * - Reference image upload
 */
export default async function KinksterCreatorPage() {
  await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">KINKSTER Creator</h1>
          <p className="text-gray-400">
            Create and manage your KINKSTER characters with custom AI-generated avatars
          </p>
        </div>
        <KinksterCreationWizard />
      </div>
    </div>
  )
}
