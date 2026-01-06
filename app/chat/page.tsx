import { redirect } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth/get-user"
import { EnhancedAIChatInterface } from "@/components/chat/enhanced-ai-chat-interface"
import { KinksterChatSelector } from "@/components/chat/kinkster-chat-selector"

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
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* KINKSTER Chat Selector - Show when not chatting with a specific KINKSTER */}
        {!params.kinkster && (
          <KinksterChatSelector />
        )}
        
        {/* Main Chat Interface */}
        <EnhancedAIChatInterface
          agentName="KINK IT Assistant"
          profile={profile}
          kinksterId={params.kinkster}
        />
      </div>
    </div>
  )
}


