import { NextRequest, NextResponse } from "next/server"

/**
 * Eleven Labs API Key Validation Route
 * 
 * Validates an Eleven Labs API key by making a test request.
 */
export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json()

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Test the API key by fetching user info
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Invalid API key" }))
      return NextResponse.json(
        { 
          valid: false,
          error: error.error?.message || "Invalid API key" 
        },
        { status: 200 } // Return 200 so frontend can handle the validation result
      )
    }

    const userData = await response.json()

    return NextResponse.json({
      valid: true,
      user: {
        subscription: userData.subscription?.tier || "free",
        character_count: userData.subscription?.character_count || 0,
        character_limit: userData.subscription?.character_limit || 0,
      },
    })
  } catch (error) {
    console.error("Eleven Labs API key validation error:", error)
    return NextResponse.json(
      { 
        valid: false,
        error: error instanceof Error ? error.message : "Failed to validate API key" 
      },
      { status: 200 }
    )
  }
}
