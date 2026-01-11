"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import "katex/dist/katex.min.css"
import { cn } from "@/lib/utils"

interface MarkdownMessageProps {
  content: string
  className?: string
}

/**
 * MarkdownMessage Component
 * 
 * Renders markdown content with:
 * - LaTeX math support (inline $...$ and block $$...$$)
 * - Syntax highlighted code blocks
 * - Proper link handling
 * - Styled to match chat interface
 */
export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("markdown-content w-full", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code blocks with syntax highlighting
          code({ node, inline, className: codeClassName, children, ...props }: any) {
            const match = /language-(\w+)/.exec(codeClassName || "")
            const language = match ? match[1] : ""
            
            if (!inline && language) {
              return (
                <div className="my-2 rounded-md overflow-hidden">
                  <div className="overflow-x-auto scrollbar-hide scroll-smooth">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                        minWidth: "fit-content",
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )
            }
            
            // Inline code
            return (
              <code
                className={cn(
                  "relative rounded bg-muted/80 px-[0.3rem] py-[0.2rem] font-mono text-sm text-foreground",
                  codeClassName
                )}
                {...props}
              >
                {children}
              </code>
            )
          },
          // Links
          a({ node, href, children, ...props }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
                {...props}
              >
                {children}
              </a>
            )
          },
          // Headings
          h1: ({ node, ...props }: any) => (
            <h1 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />
          ),
          h2: ({ node, ...props }: any) => (
            <h2 className="text-lg font-semibold mt-3 mb-2 text-foreground" {...props} />
          ),
          h3: ({ node, ...props }: any) => (
            <h3 className="text-base font-semibold mt-2 mb-1 text-foreground" {...props} />
          ),
          // Lists
          ul: ({ node, ...props }: any) => (
            <ul className="list-disc list-inside my-2 space-y-1 text-foreground" {...props} />
          ),
          ol: ({ node, ...props }: any) => (
            <ol className="list-decimal list-inside my-2 space-y-1 text-foreground" {...props} />
          ),
          li: ({ node, ...props }: any) => (
            <li className="text-foreground" {...props} />
          ),
          // Paragraphs
          p: ({ node, ...props }: any) => (
            <p className="my-1.5 leading-relaxed text-foreground" {...props} />
          ),
          // Blockquotes
          blockquote: ({ node, ...props }: any) => (
            <blockquote
              className="border-l-4 border-primary/30 pl-4 my-2 italic text-muted-foreground"
              {...props}
            />
          ),
          // Tables
          table: ({ node, ...props }: any) => (
            <div className="overflow-x-auto scrollbar-hide scroll-smooth my-2">
              <table className="min-w-full border-collapse border border-border rounded-md" {...props} />
            </div>
          ),
          th: ({ node, ...props }: any) => (
            <th className="border border-border px-3 py-2 bg-muted font-semibold text-left text-foreground" {...props} />
          ),
          td: ({ node, ...props }: any) => (
            <td className="border border-border px-3 py-2 text-foreground" {...props} />
          ),
          // Horizontal rule
          hr: ({ node, ...props }: any) => (
            <hr className="my-4 border-border" {...props} />
          ),
          // Strong/Bold
          strong: ({ node, ...props }: any) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          // Emphasis/Italic
          em: ({ node, ...props }: any) => (
            <em className="italic text-foreground" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
