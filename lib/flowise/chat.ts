import { getFlowiseClient } from "./client"
import type { FlowiseChatflowConfig, FlowisePredictionResponse } from "./client"

/**
 * Send a message to Flowise chatflow (non-streaming)
 */
export async function sendFlowiseMessage(
  config: FlowiseChatflowConfig,
  question: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<FlowisePredictionResponse> {
  const client = getFlowiseClient()

  try {
    const response = await client.createPrediction({
      chatflowId: config.chatflowId,
      question,
      streaming: false,
      chatId: config.chatId,
      overrideConfig: config.overrideConfig,
      history: history?.map((msg) => ({
        type: msg.role === "user" ? "userMessage" : "assistantMessage",
        message: msg.content,
      })),
    })

    // Flowise SDK returns an async iterator even for non-streaming
    // We need to collect all chunks
    let fullText = ""
    let sourceDocuments: any[] = []
    let sessionId: string | undefined
    let chatId: string | undefined

    for await (const chunk of response) {
      if (typeof chunk === "string") {
        fullText += chunk
      } else if (chunk && typeof chunk === "object") {
        // Handle structured response
        if (chunk.text) fullText += chunk.text
        if (chunk.sourceDocuments) sourceDocuments = chunk.sourceDocuments
        if (chunk.sessionId) sessionId = chunk.sessionId
        if (chunk.chatId) chatId = chunk.chatId
      }
    }

    return {
      text: fullText,
      sourceDocuments: sourceDocuments.length > 0 ? sourceDocuments : undefined,
      sessionId,
      chatId,
    }
  } catch (error) {
    console.error("[Flowise] Error sending message:", error)
    throw error instanceof Error ? error : new Error("Failed to send message to Flowise")
  }
}

/**
 * Stream a message to Flowise chatflow
 * Returns an async generator that yields text chunks
 */
export async function* streamFlowiseMessage(
  config: FlowiseChatflowConfig,
  question: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): AsyncGenerator<string, void, unknown> {
  const client = getFlowiseClient()

  try {
    const response = await client.createPrediction({
      chatflowId: config.chatflowId,
      question,
      streaming: true,
      chatId: config.chatId,
      overrideConfig: config.overrideConfig,
      history: history?.map((msg) => ({
        type: msg.role === "user" ? "userMessage" : "assistantMessage",
        message: msg.content,
      })),
    })

    for await (const chunk of response) {
      if (typeof chunk === "string") {
        yield chunk
      } else if (chunk && typeof chunk === "object" && chunk.text) {
        yield chunk.text
      }
    }
  } catch (error) {
    console.error("[Flowise] Error streaming message:", error)
    throw error instanceof Error ? error : new Error("Failed to stream message from Flowise")
  }
}

/**
 * Get chatflow ID for a Kinkster
 * 
 * NOTE: Kinky Kincade uses OpenAI, not Flowise. This function is only for Kinksters.
 * 
 * @param kinksterId - The Kinkster's ID
 * @param kinksterChatflowId - The Kinkster's configured Flowise chatflow ID
 * @returns The chatflow ID, or throws error if not configured
 */
export function getKinksterChatflowId(kinksterId: string, kinksterChatflowId?: string | null): string {
  // Kinksters must have a chatflowId configured
  if (!kinksterChatflowId) {
    throw new Error(
      `Kinkster ${kinksterId} has no Flowise chatflowId configured. ` +
      `Please configure flowise_chatflow_id for this Kinkster in the database.`
    )
  }

  return kinksterChatflowId
}

/**
 * @deprecated Kinky Kincade uses OpenAI, not Flowise. This function is no longer used.
 * Use /api/openai/chat for Kinky Kincade instead.
 */
export function getKinkyKincadeChatflowId(): never {
  throw new Error(
    "Kinky Kincade uses OpenAI, not Flowise. " +
    "Use /api/openai/chat endpoint instead of Flowise API."
  )
}
