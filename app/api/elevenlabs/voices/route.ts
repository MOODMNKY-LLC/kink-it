import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Eleven Labs Voices API Route
 * 
 * Fetches available voices from Eleven Labs API.
 * Keeps API key secure on the server side.
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if API key is provided as query parameter (for validation flow)
    const { searchParams } = new URL(req.url)
    const providedApiKey = searchParams.get("apiKey")

    let apiKey: string | null = null

    if (providedApiKey) {
      // Use provided API key (for validation/testing)
      apiKey = providedApiKey
    } else {
      // Get user's Eleven Labs API key from database
      const { data: settings, error: settingsError } = await supabase
        .from("user_chat_settings")
        .select("tts_api_key_encrypted")
        .eq("user_id", user.id)
        .eq("agent_name", "Kinky Kincade")
        .single()

      if (settingsError || !settings?.tts_api_key_encrypted) {
        return NextResponse.json(
          { error: "Eleven Labs API key not configured" },
          { status: 400 }
        )
      }

      apiKey = settings.tts_api_key_encrypted
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Eleven Labs API key is required" },
        { status: 400 }
      )
    }

    // Fetch voices from Eleven Labs API
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Eleven Labs API error" }))
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch voices" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Format voices for frontend
    const voices = data.voices?.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      preview_url: voice.preview_url,
    })) || []

    return NextResponse.json({ voices })
  } catch (error) {
    console.error("Eleven Labs voices API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch voices" },
      { status: 500 }
    )
  }
}
