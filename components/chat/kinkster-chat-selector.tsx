"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Kinkster } from "@/types/kinkster"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface KinksterChatSelectorProps {
  onKinksterSelect?: (kinksterId: string) => void
  className?: string
}

export function KinksterChatSelector({ onKinksterSelect, className }: KinksterChatSelectorProps) {
  const [kinksters, setKinksters] = useState<Kinkster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedKinkster, setSelectedKinkster] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchKinksters = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("kinksters")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[KinksterChatSelector] Error fetching kinksters:", error)
          return
        }

        setKinksters(data || [])
      } catch (error) {
        console.error("[KinksterChatSelector] Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchKinksters()
  }, [supabase])

  const handleKinksterSelect = (kinksterId: string) => {
    setSelectedKinkster(kinksterId)
    if (onKinksterSelect) {
      onKinksterSelect(kinksterId)
    } else {
      // Navigate to chat with KINKSTER
      router.push(`/chat?kinkster=${kinksterId}`)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading KINKSTERS...</div>
        </CardContent>
      </Card>
    )
  }

  if (kinksters.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Chat with KINKSTERS
          </CardTitle>
          <CardDescription>
            Create KINKSTER avatars to chat with them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/playground/kinkster-creator")}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Your First KINKSTER
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Chat with Your KINKSTERS
        </CardTitle>
        <CardDescription>
          Select a KINKSTER avatar to start a conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kinksters.map((kinkster) => (
            <Button
              key={kinkster.id}
              variant={selectedKinkster === kinkster.id ? "default" : "outline"}
              className={cn(
                "h-auto p-4 flex items-start gap-3 justify-start",
                selectedKinkster === kinkster.id && "ring-2 ring-primary"
              )}
              onClick={() => handleKinksterSelect(kinkster.id)}
            >
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={kinkster.avatar_url || undefined} alt={kinkster.name} />
                <AvatarFallback>{kinkster.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold truncate">{kinkster.name}</span>
                  {kinkster.is_primary && (
                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                  )}
                </div>
                {kinkster.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{kinkster.bio}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Start Chat</span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


