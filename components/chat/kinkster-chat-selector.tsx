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
import { KinksterTradingCard } from "@/components/kinksters/kinkster-trading-card"

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
          .or(`is_system_kinkster.eq.true,user_id.eq.${user.id}`)
          .eq("is_active", true)
          .order("is_system_kinkster", { ascending: false }) // System kinksters first
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kinksters.map((kinkster) => (
            <KinksterTradingCard
              key={kinkster.id}
              kinkster={kinkster}
              onClick={() => handleKinksterSelect(kinkster.id)}
              selected={selectedKinkster === kinkster.id}
              variant="compact"
              showStats={true}
              showBio={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
