import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/auth/get-user"
import KinksterCreationWizard from "@/components/kinksters/kinkster-creation-wizard"

export default async function CreateKinksterPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <KinksterCreationWizard />
    </div>
  )
}
