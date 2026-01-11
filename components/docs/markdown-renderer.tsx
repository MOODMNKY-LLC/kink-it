"use client"

import ReactMarkdown from "react-markdown"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ node, ...props }) => <h1 className="text-3xl font-display mt-8 mb-4 text-foreground" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-2xl font-display mt-6 mb-3 text-foreground" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-xl font-display mt-4 mb-2 text-foreground" {...props} />,
        p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-muted-foreground" {...props} />,
        ul: ({ node, ...props }) => <ul className="space-y-2 my-4 ml-6 list-disc" {...props} />,
        ol: ({ node, ...props }) => <ol className="space-y-2 my-4 ml-6 list-decimal" {...props} />,
        li: ({ node, ...props }) => <li className="leading-relaxed text-muted-foreground" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
        em: ({ node, ...props }) => <em className="italic text-muted-foreground" {...props} />,
        code: ({ node, inline, ...props }: any) =>
          inline ? (
            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
          ) : (
            <code className="block p-4 overflow-x-auto bg-sidebar-accent border border-border rounded font-mono text-sm" {...props} />
          ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-primary bg-primary/5 py-2 px-4 my-4 italic" {...props} />
        ),
        a: ({ node, ...props }) => (
          <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
