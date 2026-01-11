import { redirect } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth/get-user"
import { KinkyChatInterface } from "@/components/chat/kinky-chat-interface"

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ kinkster?: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const profile = await getUserProfile()

  // Await searchParams before accessing properties (Next.js 15 requirement)
  const params = await searchParams

  return (
    <div className="w-full h-screen sm:h-[calc(100vh-8rem)] sm:container sm:mx-auto sm:py-8 flex flex-col">
      <div className="w-full h-full sm:max-w-6xl sm:mx-auto flex flex-col">
        <KinkyChatInterface
          profile={profile}
          initialKinksterId={params.kinkster}
        />
      </div>
    </div>
  )
}
