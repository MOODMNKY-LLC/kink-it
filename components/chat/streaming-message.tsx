"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"

interface StreamingMessageProps {
  content: string
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex gap-3 flex-row">
      <KinkyAvatar size={32} variant="chat" />
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
