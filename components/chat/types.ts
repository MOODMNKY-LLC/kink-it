export interface ChatMessage {
  id?: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  isStreaming?: boolean
  toolCalls?: any[]
  toolCallId?: string
  createdAt?: Date
  metadata?: Record<string, any>
}

export interface Conversation {
  id: string
  userId: string
  title?: string
  agentName?: string
  agentConfig?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}



