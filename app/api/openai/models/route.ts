import { NextResponse } from "next/server"

/**
 * GET /api/openai/models
 * 
 * Fetches available OpenAI models from their API
 * Filters for models that support chat completions
 * Returns formatted list for UI selection
 */
export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    // Fetch models from OpenAI API
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      return NextResponse.json(
        { error: `OpenAI API error: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const models = data.data || []

    // Filter for models that support chat completions
    // Based on OpenAI's model naming and capabilities
    const chatModels = models
      .filter((model: any) => {
        const id = model.id.toLowerCase()
        
        // Include GPT-5 series
        if (id.startsWith("gpt-5")) return true
        
        // Include GPT-4 series (including o models)
        if (id.startsWith("gpt-4")) return true
        if (id.startsWith("o1") || id.startsWith("o3") || id.startsWith("o4")) return true
        
        // Include GPT-3.5 series
        if (id.startsWith("gpt-3.5")) return true
        
        // Exclude deprecated, embeddings, fine-tuning, and other non-chat models
        if (
          id.includes("embedding") ||
          id.includes("instruct") ||
          id.includes("davinci") ||
          id.includes("curie") ||
          id.includes("babbage") ||
          id.includes("ada") ||
          id.includes("whisper") ||
          id.includes("tts") ||
          id.includes("dall-e") ||
          id.includes("moderation")
        ) {
          return false
        }
        
        return false
      })
      .map((model: any) => ({
        id: model.id,
        name: formatModelName(model.id),
        created: model.created,
        owned_by: model.owned_by,
      }))
      .sort((a: any, b: any) => {
        // Sort by: GPT-5 series first, then GPT-4, then GPT-3.5
        const getPriority = (id: string) => {
          if (id.startsWith("gpt-5")) return 1
          if (id.startsWith("o3") || id.startsWith("o4")) return 2
          if (id.startsWith("gpt-4")) return 3
          if (id.startsWith("o1")) return 4
          if (id.startsWith("gpt-3.5")) return 5
          return 6
        }
        const priorityA = getPriority(a.id.toLowerCase())
        const priorityB = getPriority(b.id.toLowerCase())
        if (priorityA !== priorityB) return priorityA - priorityB
        
        // Within same priority, sort by creation date (newest first)
        return (b.created || 0) - (a.created || 0)
      })

    return NextResponse.json({
      models: chatModels,
      total: chatModels.length,
    })
  } catch (error) {
    console.error("Error fetching OpenAI models:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch models",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Format model ID into human-readable name
 */
function formatModelName(modelId: string): string {
  const id = modelId.toLowerCase()
  
  // GPT-5 series
  if (id.startsWith("gpt-5-codex")) {
    return "GPT-5 Codex (Coding Specialist)"
  }
  if (id.startsWith("gpt-5-chat")) {
    return "GPT-5 Chat"
  }
  if (id.startsWith("gpt-5-nano")) {
    return "GPT-5 Nano (Ultra Fast)"
  }
  if (id.startsWith("gpt-5-mini")) {
    return "GPT-5 Mini (Fast & Efficient)"
  }
  if (id.startsWith("gpt-5")) {
    return "GPT-5 (Flagship)"
  }
  
  // Reasoning models
  if (id.startsWith("o3-pro")) {
    return "o3 Pro (Advanced Reasoning)"
  }
  if (id.startsWith("o3-mini")) {
    return "o3 Mini (Efficient Reasoning)"
  }
  if (id.startsWith("o3")) {
    return "o3 (Advanced Reasoning)"
  }
  if (id.startsWith("o4-mini")) {
    return "o4 Mini (Cost-Efficient Reasoning)"
  }
  if (id.startsWith("o1-pro")) {
    return "o1 Pro (Deep Reasoning)"
  }
  if (id.startsWith("o1-mini")) {
    return "o1 Mini (Efficient Reasoning)"
  }
  if (id.startsWith("o1")) {
    return "o1 (Reasoning)"
  }
  
  // GPT-4 series
  if (id.includes("4.1")) {
    return "GPT-4.1"
  }
  if (id.includes("4.5")) {
    return "GPT-4.5"
  }
  if (id.includes("4o-mini")) {
    return "GPT-4o Mini (Fast & Cost-Effective)"
  }
  if (id.includes("4o")) {
    return "GPT-4o (Balanced)"
  }
  if (id.includes("4-turbo")) {
    return "GPT-4 Turbo (Advanced)"
  }
  if (id.startsWith("gpt-4")) {
    return "GPT-4"
  }
  
  // GPT-3.5 series
  if (id.includes("3.5-turbo")) {
    return "GPT-3.5 Turbo"
  }
  if (id.startsWith("gpt-3.5")) {
    return "GPT-3.5"
  }
  
  // Fallback: return formatted ID
  return modelId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
