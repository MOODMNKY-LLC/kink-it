import { requireAuth } from "@/lib/auth/get-user"
import { SceneComposer } from "@/components/playground/scene-composition/scene-composer"

export default async function SceneCompositionPage() {
  await requireAuth()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Scene Composition</h1>
        <p className="text-muted-foreground mt-2">
          Place your KINKSTER characters into AI-generated scenes for roleplay experiences
        </p>
      </div>
      <SceneComposer />
    </div>
  )
}



