import { FlowiseClient } from "flowise-sdk"

/**
 * Flowise Client Singleton
 * Manages connection to Flowise AI instance
 */
class FlowiseClientManager {
  private client: FlowiseClient | null = null

  /**
   * Initialize Flowise client
   * Works in both server and client environments
   */
  initialize() {
    // Client-side: use NEXT_PUBLIC_ prefix
    // Server-side: can use either NEXT_PUBLIC_ or non-prefixed
    const baseUrl = 
      (typeof window !== "undefined" 
        ? process.env.NEXT_PUBLIC_FLOWISE_URL 
        : process.env.NEXT_PUBLIC_FLOWISE_URL || process.env.FLOWISE_URL) || 
      "https://flowise-dev.moodmnky.com"
    
    const apiKey = process.env.FLOWISE_API_KEY || 
                   process.env.NEXT_PUBLIC_FLOWISE_API_KEY

    if (!baseUrl) {
      throw new Error("Flowise URL not configured. Set NEXT_PUBLIC_FLOWISE_URL or FLOWISE_URL")
    }

    if (!apiKey) {
      throw new Error("Flowise API key not configured. Set FLOWISE_API_KEY")
    }

    this.client = new FlowiseClient({
      baseUrl: baseUrl.replace(/\/$/, ""), // Remove trailing slash
      apiKey,
    })

    return this.client
  }

  /**
   * Get Flowise client instance
   */
  getClient(): FlowiseClient {
    if (!this.client) {
      return this.initialize()
    }
    return this.client
  }
}

// Export singleton instance
export const flowiseClient = new FlowiseClientManager()

/**
 * Get Flowise client (initializes if needed)
 */
export function getFlowiseClient(): FlowiseClient {
  return flowiseClient.getClient()
}

/**
 * Flowise Chatflow Configuration
 */
export interface FlowiseChatflowConfig {
  chatflowId: string
  chatId?: string // For conversation continuity
  overrideConfig?: {
    sessionId?: string
    temperature?: number
    maxTokens?: number
    returnSourceDocuments?: boolean
  }
}

/**
 * Flowise Prediction Response
 */
export interface FlowisePredictionResponse {
  text: string
  sourceDocuments?: any[]
  sessionId?: string
  chatId?: string
}
