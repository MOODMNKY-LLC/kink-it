/**
 * Message Parser for AI Elements Components
 * 
 * Parses message content to detect different content types and extract
 * structured data for rendering with AI Elements components.
 */

export interface ParsedMessagePart {
  type: "text" | "code" | "tool" | "reasoning" | "source" | "artifact" | "image" | "citation" | "task"
  content: string
  language?: string
  metadata?: Record<string, any>
}

export interface ParsedMessage {
  parts: ParsedMessagePart[]
  hasStructuredContent: boolean
}

/**
 * Detects if content contains tool call patterns
 */
function detectToolCalls(content: string): ParsedMessagePart[] {
  const toolParts: ParsedMessagePart[] = []
  
  // Pattern 1: JSON tool call objects
  const toolCallRegex = /```json\s*({[\s\S]*?"type"\s*:\s*"tool[^}]*?})[\s\S]*?```/gi
  let match
  while ((match = toolCallRegex.exec(content)) !== null) {
    try {
      const toolData = JSON.parse(match[1])
      if (toolData.type?.startsWith("tool")) {
        toolParts.push({
          type: "tool",
          content: match[0],
          metadata: toolData,
        })
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  
  // Pattern 2: Tool execution indicators in text
  const toolExecutionPatterns = [
    /\[Tool:\s*([^\]]+)\]/gi,
    /Calling tool:\s*([^\n]+)/gi,
    /Executing:\s*([^\n]+)/gi,
  ]
  
  toolExecutionPatterns.forEach((pattern) => {
    let toolMatch
    while ((toolMatch = pattern.exec(content)) !== null) {
      toolParts.push({
        type: "tool",
        content: toolMatch[0],
        metadata: { name: toolMatch[1] },
      })
    }
  })
  
  return toolParts
}

/**
 * Detects reasoning/thinking patterns
 */
function detectReasoning(content: string): ParsedMessagePart[] {
  const reasoningParts: ParsedMessagePart[] = []
  
  const reasoningPatterns = [
    /\[Reasoning\]\s*([\s\S]*?)(?=\n\n|$)/gi,
    /Thinking:\s*([\s\S]*?)(?=\n\n|$)/gi,
    /Let me think[:\s]*([\s\S]*?)(?=\n\n|$)/gi,
    /<thinking>([\s\S]*?)<\/thinking>/gi,
  ]
  
  reasoningPatterns.forEach((pattern) => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      reasoningParts.push({
        type: "reasoning",
        content: match[1].trim(),
      })
    }
  })
  
  return reasoningParts
}

/**
 * Detects source citations (for Sources component)
 */
function detectSources(content: string): ParsedMessagePart[] {
  const sourceParts: ParsedMessagePart[] = []
  
  // Pattern 1: Markdown links that look like citations
  const citationLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g
  let match
  while ((match = citationLinkRegex.exec(content)) !== null) {
    sourceParts.push({
      type: "source",
      content: match[0],
      metadata: {
        title: match[1],
        url: match[2],
      },
    })
  }
  
  // Pattern 2: Numbered citations [1], [2], etc.
  const numberedCitationRegex = /\[(\d+)\]/g
  while ((match = numberedCitationRegex.exec(content)) !== null) {
    sourceParts.push({
      type: "source",
      content: match[0],
      metadata: {
        index: parseInt(match[1]),
      },
    })
  }
  
  return sourceParts
}

/**
 * Detects inline citations (for InlineCitation component)
 */
function detectInlineCitations(content: string): ParsedMessagePart[] {
  const citationParts: ParsedMessagePart[] = []
  
  // Pattern: Inline citations with hover cards [citation](url)
  const inlineCitationRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g
  let match
  while ((match = inlineCitationRegex.exec(content)) !== null) {
    citationParts.push({
      type: "citation",
      content: match[0],
      metadata: {
        text: match[1],
        url: match[2],
      },
    })
  }
  
  return citationParts
}

/**
 * Detects task patterns
 */
function detectTasks(content: string): ParsedMessagePart[] {
  const taskParts: ParsedMessagePart[] = []
  
  // Pattern 1: Task lists with checkboxes
  const taskListRegex = /(?:^|\n)[-*]\s+\[([ xX])\]\s+(.+)/gm
  let match
  while ((match = taskListRegex.exec(content)) !== null) {
    taskParts.push({
      type: "task",
      content: match[2],
      metadata: {
        completed: match[1].toLowerCase() === "x",
      },
    })
  }
  
  // Pattern 2: Numbered task lists
  const numberedTaskRegex = /(?:^|\n)(\d+)\.\s+(.+)/gm
  while ((match = numberedTaskRegex.exec(content)) !== null) {
    taskParts.push({
      type: "task",
      content: match[2],
      metadata: {
        index: parseInt(match[1]),
      },
    })
  }
  
  return taskParts
}

/**
 * Detects code blocks
 */
function detectCodeBlocks(content: string): ParsedMessagePart[] {
  const codeParts: ParsedMessagePart[] = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeParts.push({
      type: "code",
      content: match[2].trim(),
      language: match[1] || "text",
    })
  }
  
  return codeParts
}

/**
 * Detects image URLs or base64 images
 */
function detectImages(content: string): ParsedMessagePart[] {
  const imageParts: ParsedMessagePart[] = []
  
  // Pattern 1: Image URLs
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi
  let match
  while ((match = imageUrlRegex.exec(content)) !== null) {
    imageParts.push({
      type: "image",
      content: match[0],
      metadata: {
        url: match[0],
      },
    })
  }
  
  // Pattern 2: Base64 images
  const base64ImageRegex = /data:image\/([^;]+);base64,([^\s]+)/g
  while ((match = base64ImageRegex.exec(content)) !== null) {
    imageParts.push({
      type: "image",
      content: match[0],
      metadata: {
        base64: match[2],
        mediaType: `image/${match[1]}`,
      },
    })
  }
  
  return imageParts
}

/**
 * Detects artifact patterns (structured content blocks)
 */
function detectArtifacts(content: string): ParsedMessagePart[] {
  const artifactParts: ParsedMessagePart[] = []
  
  // Pattern 1: JSON artifacts
  const jsonArtifactRegex = /```json\s*({[\s\S]*?"artifact"[^}]*?})[\s\S]*?```/gi
  let match
  while ((match = jsonArtifactRegex.exec(content)) !== null) {
    try {
      const artifactData = JSON.parse(match[1])
      if (artifactData.artifact || artifactData.type === "artifact") {
        artifactParts.push({
          type: "artifact",
          content: match[0],
          metadata: artifactData,
        })
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  
  return artifactParts
}

/**
 * Parses message content into structured parts
 */
export function parseMessageContent(content: string): ParsedMessage {
  if (!content || typeof content !== "string") {
    return {
      parts: [{ type: "text", content: content || "" }],
      hasStructuredContent: false,
    }
  }
  
  const parts: ParsedMessagePart[] = []
  
  // Detect all structured content types
  const codeBlocks = detectCodeBlocks(content)
  const toolCalls = detectToolCalls(content)
  const reasoning = detectReasoning(content)
  const sources = detectSources(content)
  const images = detectImages(content)
  const artifacts = detectArtifacts(content)
  const citations = detectInlineCitations(content)
  const tasks = detectTasks(content)
  
  const hasStructuredContent = 
    codeBlocks.length > 0 ||
    toolCalls.length > 0 ||
    reasoning.length > 0 ||
    sources.length > 0 ||
    images.length > 0 ||
    artifacts.length > 0 ||
    citations.length > 0 ||
    tasks.length > 0
  
  // If no structured content, return as plain text
  if (!hasStructuredContent) {
    return {
      parts: [{ type: "text", content }],
      hasStructuredContent: false,
    }
  }
  
  // Simplified approach: Process code blocks first (they have clear boundaries)
  // Then add other detected patterns
  // This is a pragmatic approach that works well for most cases
  
  // Extract code blocks with their full match text for position tracking
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const codeBlockRanges: Array<{ start: number; end: number }> = []
  let codeMatch
  
  codeBlockRegex.lastIndex = 0
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    codeBlockRanges.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length,
    })
  }
  
  // Helper to check if a position is inside a code block
  const isInCodeBlock = (pos: number) => {
    return codeBlockRanges.some((range) => pos >= range.start && pos < range.end)
  }
  
  // Process code blocks first
  let lastIndex = 0
  codeBlockRanges.forEach((range) => {
    // Add text before code block
    if (range.start > lastIndex) {
      const textBefore = content.slice(lastIndex, range.start).trim()
      if (textBefore) {
        parts.push({ type: "text", content: textBefore })
      }
    }
    
    // Extract and add code block
    const codeMatch = content.slice(range.start, range.end).match(/```(\w+)?\n([\s\S]*?)```/)
    if (codeMatch) {
      parts.push({
        type: "code",
        content: codeMatch[2].trim(),
        language: codeMatch[1] || "text",
      })
    }
    
    lastIndex = range.end
  })
  
  // Process remaining content (after code blocks)
  const remainingContent = lastIndex < content.length ? content.slice(lastIndex) : content
  
  // Add other structured parts found in remaining content
  // Filter out any that overlap with code blocks
  const remainingToolCalls = toolCalls.filter((part) => {
    const partIndex = content.indexOf(part.content)
    return partIndex === -1 || !isInCodeBlock(partIndex)
  })
  
  const remainingReasoning = reasoning.filter((part) => {
    const partIndex = content.indexOf(part.content)
    return partIndex === -1 || !isInCodeBlock(partIndex)
  })
  
  const remainingImages = images.filter((part) => {
    const partIndex = content.indexOf(part.content)
    return partIndex === -1 || !isInCodeBlock(partIndex)
  })
  
  const remainingArtifacts = artifacts.filter((part) => {
    const partIndex = content.indexOf(part.content)
    return partIndex === -1 || !isInCodeBlock(partIndex)
  })
  
  const remainingTasks = tasks.filter((part) => {
    const partIndex = content.indexOf(part.content)
    return partIndex === -1 || !isInCodeBlock(partIndex)
  })
  
  // Add remaining text if any
  if (remainingContent.trim() && 
      remainingToolCalls.length === 0 && 
      remainingReasoning.length === 0 &&
      remainingImages.length === 0 &&
      remainingArtifacts.length === 0 &&
      remainingTasks.length === 0) {
    parts.push({ type: "text", content: remainingContent.trim() })
  } else {
    // Add structured parts found in remaining content
    parts.push(...remainingToolCalls)
    parts.push(...remainingReasoning)
    parts.push(...remainingImages)
    parts.push(...remainingArtifacts)
    parts.push(...remainingTasks)
    
    // If we added structured parts but no text, add remaining text
    if (remainingContent.trim()) {
      parts.push({ type: "text", content: remainingContent.trim() })
    }
  }
  
  // Add sources at the end if detected
  if (sources.length > 0) {
    const hasSources = parts.some((p) => p.type === "source")
    if (!hasSources) {
      parts.push({
        type: "source",
        content: "",
        metadata: { sources: sources.map((s) => s.metadata) },
      })
    }
  }
  
  return {
    parts,
    hasStructuredContent: true,
  }
}

