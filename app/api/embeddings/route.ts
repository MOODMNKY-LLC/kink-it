import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Generate embedding using OpenAI
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: "Failed to generate embedding", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const embedding = data.data?.[0]?.embedding

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json({ error: "Invalid embedding response" }, { status: 500 })
    }

    return NextResponse.json({ embedding })
  } catch (error: any) {
    console.error("Error generating embedding:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
