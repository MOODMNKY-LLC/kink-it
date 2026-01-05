"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface NotionGuide {
  id: string
  title: string
  description: string
  category: string
  content: string
  icon?: string
}

interface NotionDocRendererProps {
  guide: NotionGuide
}

export function NotionDocRenderer({ guide }: NotionDocRendererProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <Card className="p-6 bg-sidebar border-border hover:bg-sidebar-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {guide.icon && <div className="text-4xl mt-1 shrink-0">{guide.icon}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-display text-foreground">{guide.title}</h2>
              <Badge variant="outline" className="shrink-0">
                {guide.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shrink-0"
        >
          {isExpanded ? "Collapse" : "Read Guide"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="prose prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-sidebar-accent prose-pre:border prose-pre:border-border prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-ul:text-muted-foreground prose-ol:text-muted-foreground max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-display mt-8 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-display mt-6 mb-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-display mt-4 mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="space-y-2 my-4 ml-6" {...props} />,
                ol: ({ node, ...props }) => <ol className="space-y-2 my-4 ml-6" {...props} />,
                li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="my-4" {...props} />,
                code: ({ node, inline, ...props }) =>
                  inline ? <code {...props} /> : <code className="block p-4 overflow-x-auto" {...props} />,
              }}
            >
              {guide.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </Card>
  )
}
