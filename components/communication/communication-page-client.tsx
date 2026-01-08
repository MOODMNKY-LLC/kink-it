"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { CheckInForm } from "./check-in-form"
import { useMessages } from "@/hooks/use-messages"
import { useCheckIns } from "@/hooks/use-check-ins"
import { toast } from "sonner"
import type { DynamicRole } from "@/types/profile"

interface CommunicationPageClientProps {
  userId: string
  partnerId: string | null
  userRole: DynamicRole
}

export function CommunicationPageClient({
  userId,
  partnerId,
  userRole,
}: CommunicationPageClientProps) {
  const [activeTab, setActiveTab] = useState<"messages" | "check-ins">("messages")

  const { messages, isLoading: messagesLoading, sendMessage, markAsRead } = useMessages({
    userId,
    partnerId,
  })

  const {
    checkIns,
    todayCheckIn,
    isLoading: checkInsLoading,
    submitCheckIn,
  } = useCheckIns({
    userId,
    partnerId,
  })

  const handleSendMessage = async (content: string) => {
    if (!partnerId) {
      toast.error("No partner found")
      return
    }
    await sendMessage(content)
  }

  const handleCheckIn = async (status: "green" | "yellow" | "red", notes?: string) => {
    await submitCheckIn(status, notes)
  }

  if (!partnerId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-2">No partner linked</p>
        <p className="text-sm text-muted-foreground/70">
          Link your partner in profile settings to start communicating
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="check-ins">Check-Ins</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 flex flex-col mt-4">
          <div className="flex-1 overflow-hidden">
            <MessageList
              messages={messages}
              currentUserId={userId}
              isLoading={messagesLoading}
              onMessageRead={markAsRead}
            />
          </div>
          <MessageInput
            onSend={handleSendMessage}
            disabled={messagesLoading}
            placeholder="Type a message to your partner..."
          />
        </TabsContent>

        <TabsContent value="check-ins" className="flex-1 mt-4">
          <div className="space-y-6">
            <CheckInForm
              onSubmit={handleCheckIn}
              currentStatus={todayCheckIn?.status || null}
              disabled={checkInsLoading}
            />

            {checkIns.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Check-In History</h3>
                <div className="space-y-2">
                  {checkIns.slice(0, 10).map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-center justify-between p-3 bg-sidebar rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            checkIn.status === "green"
                              ? "bg-green-500"
                              : checkIn.status === "yellow"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium capitalize">{checkIn.status}</div>
                          {checkIn.notes && (
                            <div className="text-sm text-muted-foreground">{checkIn.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(checkIn.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
