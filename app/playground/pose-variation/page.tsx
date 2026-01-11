import { requireAuth } from "@/lib/auth/get-user"
import { PoseVariation } from "@/components/playground/pose-variation/pose-variation"

export default async function PoseVariationPage() {
  await requireAuth()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pose Variation</h1>
        <p className="text-muted-foreground mt-2">
          Generate pose variations for your KINKSTER characters while maintaining character consistency
        </p>
      </div>
      <PoseVariation />
    </div>
  )
}
