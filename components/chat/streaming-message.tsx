"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface StreamingMessageProps {
  content: string
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex gap-3 flex-row">
      <Avatar className="shrink-0">
        <AvatarFallback>
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <Card className="max-w-[80%]">
        <CardContent className="p-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
            <span className="animate-pulse">▊</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

