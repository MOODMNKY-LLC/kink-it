import { requireAuth } from "@/lib/auth/get-user"
import { KinkyKincadePlayground } from "@/components/playground/kinky-kincade/kinky-kincade-playground"

export default async function KinkyKincadePlaygroundPage() {
  await requireAuth()

  return (
    <div className="h-screen w-full overflow-hidden">
      <KinkyKincadePlayground />
    </div>
  )
}
