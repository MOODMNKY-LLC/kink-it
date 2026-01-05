"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface NotionContentViewerProps {
  pageId: string
  title?: string
}

export function NotionContentViewer({ pageId, title }: NotionContentViewerProps) {
  const [content, setContent] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // This would call the Notion API to fetch page content
    // For now, we'll simulate loading
    const timer = setTimeout(() => {
      setContent("# Coming Soon\n\nThis will display live content from your Notion workspace.")
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [pageId])

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {title && <h2 className="text-2xl font-display mb-4">{title}</h2>}
      <div className="prose prose-invert max-w-none">{content}</div>
    </Card>
  )
}
