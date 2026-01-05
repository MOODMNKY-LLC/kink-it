import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <ChatInterface agentName="KINK IT Assistant" />
      </div>
    </div>
  )
}

