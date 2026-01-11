import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"
import KinksterSheet from "@/components/kinksters/kinkster-sheet"
import { Kinkster } from "@/types/kinkster"

interface KinksterPageProps {
  params: Promise<{ id: string }>
}

export default async function KinksterPage({ params }: KinksterPageProps) {
  const profile = await getUserProfile()
  if (!profile) {
    redirect("/auth/login")
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: kinkster, error } = await supabase
    .from("kinksters")
    .select("*")
    .eq("id", id)
    .eq("user_id", profile.id)
    .single()

  if (error || !kinkster) {
    redirect("/account/profile")
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <KinksterSheet kinkster={kinkster as Kinkster} />
    </div>
  )
}
