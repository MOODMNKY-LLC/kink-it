/**
 * Comprehensive Message Renderer using AI Elements Components
 * 
 * Renders message content using all available AI Elements components
 * based on detected content types.
 */

"use client"

import React from "react"
import { MessageResponse } from "@/components/ai-elements/message"
import { CodeBlock } from "@/components/ai-elements/code-block"
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning"
import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ai-elements/sources"
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactContent } from "@/components/ai-elements/artifact"
import { Image as AIImage } from "@/components/ai-elements/image"
import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation"
import { Task, TaskTrigger, TaskContent, TaskItem } from "@/components/ai-elements/task"
import { TypingAnimation } from "@/components/ui/terminal"
import type { BundledLanguage } from "shiki"
import type { ParsedMessagePart } from "@/lib/chat/message-parser"
import { cn } from "@/lib/utils"

interface MessageRendererProps {
  parts: ParsedMessagePart[]
  isStreaming?: boolean
  className?: string
}

export function MessageRenderer({ parts, isStreaming = false, className }: MessageRendererProps) {
  if (parts.length === 0) {
    return null
  }

  // Group consecutive parts of the same type for better rendering
  const groupedParts = React.useMemo(() => {
    const grouped: Array<{ type: ParsedMessagePart["type"]; parts: ParsedMessagePart[] }> = []
    
    parts.forEach((part) => {
      const lastGroup = grouped[grouped.length - 1]
      if (lastGroup && lastGroup.type === part.type) {
        lastGroup.parts.push(part)
      } else {
        grouped.push({ type: part.type, parts: [part] })
      }
    })
    
    return grouped
  }, [parts])

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      {groupedParts.map((group, groupIdx) => {
        switch (group.type) {
          case "code":
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => (
                  <div key={idx} className="not-prose w-full">
                    <CodeBlock
                      code={part.content}
                      language={(part.language || "text") as BundledLanguage}
                      showLineNumbers
                    />
                  </div>
                ))}
              </React.Fragment>
            )

          case "tool":
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => {
                  const toolData = part.metadata
                  const toolName = toolData?.name || toolData?.type || "Tool"
                  const toolState = toolData?.state || "output-available"
                  
                  return (
                    <div className="w-full">
                      <Tool defaultOpen={false}>
                        <ToolHeader
                          title={toolName}
                          type={toolData?.type || "tool-call"}
                          state={toolState as any}
                        />
                        <ToolContent>
                          {toolData?.input && (
                            <ToolInput input={toolData.input} />
                          )}
                          {toolData?.output && (
                            <ToolOutput
                              output={toolData.output}
                              errorText={toolData?.errorText}
                            />
                          )}
                          {!toolData?.input && !toolData?.output && (
                            <div className="p-4">
                              <CodeBlock code={part.content} language="json" />
                            </div>
                          )}
                        </ToolContent>
                      </Tool>
                    </div>
                  )
                })}
              </React.Fragment>
            )

          case "reasoning":
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => (
                  <div key={idx} className="w-full">
                    <Reasoning isStreaming={isStreaming} defaultOpen={true}>
                      <ReasoningTrigger />
                      <ReasoningContent>{part.content}</ReasoningContent>
                    </Reasoning>
                  </div>
                ))}
              </React.Fragment>
            )

          case "source":
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => {
                  const sources = part.metadata?.sources || []
                  
                  if (sources.length === 0) {
                    // Single source from content
                    const sourceMatch = part.content.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/)
                    if (sourceMatch) {
                      return (
                    <div key={idx} className="w-full">
                      <Sources>
                        <SourcesTrigger count={1} />
                        <SourcesContent>
                          <Source href={sourceMatch[2]} title={sourceMatch[1]} />
                        </SourcesContent>
                      </Sources>
                    </div>
                      )
                    }
                    return null
                  }
                  
                  return (
                    <div key={idx} className="w-full">
                      <Sources>
                        <SourcesTrigger count={sources.length} />
                        <SourcesContent>
                          {sources.map((source: any, sourceIdx: number) => (
                            <Source
                              key={sourceIdx}
                              href={source.url || `#source-${sourceIdx}`}
                              title={source.title || `Source ${sourceIdx + 1}`}
                            />
                          ))}
                        </SourcesContent>
                      </Sources>
                    </div>
                  )
                })}
              </React.Fragment>
            )

          case "artifact":
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => {
                  const artifactData = part.metadata || {}
                  
                  return (
                    <div key={idx} className="w-full">
                      <Artifact>
                        <ArtifactHeader>
                          <ArtifactTitle>
                            {artifactData.title || "Generated Artifact"}
                          </ArtifactTitle>
                        </ArtifactHeader>
                        <ArtifactContent>
                          {artifactData.content ? (
                            <MessageResponse>{artifactData.content}</MessageResponse>
                          ) : (
                            <CodeBlock code={part.content} language="json" />
                          )}
                        </ArtifactContent>
                      </Artifact>
                    </div>
                  )
                })}
              </React.Fragment>
            )

          case "image":
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => {
                  const imageData = part.metadata || {}
                  
                  if (imageData.base64 && imageData.mediaType) {
                    return (
                      <div key={idx} className="w-full">
                        <AIImage
                          base64={imageData.base64}
                          mediaType={imageData.mediaType}
                          alt={imageData.alt || "Generated image"}
                        />
                      </div>
                    )
                  }
                  
                  if (imageData.url) {
                    return (
                      <div key={idx} className="w-full">
                        <img
                          src={imageData.url}
                          alt={imageData.alt || "Image"}
                          className="h-auto max-w-full rounded-md"
                        />
                      </div>
                    )
                  }
                  
                  return null
                })}
              </React.Fragment>
            )

          case "citation":
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => {
                  const citationData = part.metadata || {}
                  const sources = Array.isArray(citationData.sources) 
                    ? citationData.sources 
                    : citationData.url 
                    ? [citationData.url]
                    : []
                  
                  if (sources.length === 0) return null
                  
                  return (
                    <div key={idx} className="w-full inline-block">
                      <InlineCitation>
                        <InlineCitationText>{part.content.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")}</InlineCitationText>
                        <InlineCitationCard>
                          <InlineCitationCardTrigger sources={sources} />
                          <InlineCitationCardBody>
                            <InlineCitationCarousel>
                              <InlineCitationCarouselContent>
                                {sources.map((url: string, sourceIdx: number) => (
                                  <InlineCitationCarouselItem key={sourceIdx}>
                                    <InlineCitationSource
                                      url={url}
                                      title={citationData.title || new URL(url).hostname}
                                    />
                                  </InlineCitationCarouselItem>
                                ))}
                              </InlineCitationCarouselContent>
                            </InlineCitationCarousel>
                          </InlineCitationCardBody>
                        </InlineCitationCard>
                      </InlineCitation>
                    </div>
                  )
                })}
              </React.Fragment>
            )

          case "task":
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => {
                  const taskData = part.metadata || {}
                  
                  return (
                    <div key={idx} className="w-full">
                      <Task defaultOpen={true}>
                        <TaskTrigger title={part.content} />
                        <TaskContent>
                          <TaskItem>{part.content}</TaskItem>
                        </TaskContent>
                      </Task>
                    </div>
                  )
                })}
              </React.Fragment>
            )

          case "text":
          default:
            return (
              <React.Fragment key={groupIdx}>
                {group.parts.map((part, idx) => {
                  // For streaming, use TypingAnimation for text parts
                  if (isStreaming && idx === group.parts.length - 1) {
                    return (
                      <MessageResponse
                        key={idx}
                        className="whitespace-pre-wrap break-words font-mono"
                      >
                        <TypingAnimation
                          startOnView={false}
                          duration={30}
                          className="text-foreground"
                        >
                          {part.content}
                        </TypingAnimation>
                      </MessageResponse>
                    )
                  }
                  
                  return (
                    <MessageResponse
                      key={idx}
                      className="whitespace-pre-wrap break-words font-mono"
                    >
                      {part.content}
                    </MessageResponse>
                  )
                })}
              </React.Fragment>
            )
        }
      })}
    </div>
  )
}

