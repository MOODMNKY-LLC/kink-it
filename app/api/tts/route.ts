import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * TTS API Route
 * 
 * Handles Text-to-Speech requests for Eleven Labs and OpenAI TTS APIs.
 * Keeps API keys secure on the server side.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, provider, voiceId, speed, pitch } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!provider || !["elevenlabs", "openai"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's TTS settings including provider
    // Note: OpenAI uses app's API key from env, Eleven Labs uses user's stored key
    const { data: settings, error: settingsError } = await supabase
      .from("user_chat_settings")
      .select("tts_provider, tts_api_key_encrypted")
      .eq("user_id", user.id)
      .eq("agent_name", "Kinky Kincade")
      .single()

    if (settingsError) {
      return NextResponse.json(
        { error: "TTS settings not found. Please configure voice settings." },
        { status: 404 }
      )
    }

    // Use the saved provider from database, not the request provider
    // This ensures we use the correct API key for the configured provider
    const savedProvider = settings?.tts_provider || "browser"
    
    // If saved provider is browser, don't use external TTS
    if (savedProvider === "browser") {
      return NextResponse.json(
        { error: "Browser TTS should be handled client-side. Please check your voice settings." },
        { status: 400 }
      )
    }

    // Verify the requested provider matches what's saved (for validation)
    if (savedProvider !== provider) {
      return NextResponse.json(
        { error: `Provider mismatch. Settings are configured for ${savedProvider}, but request is for ${provider}. Please update your voice settings or use the correct provider.` },
        { status: 400 }
      )
    }

    // Use the saved provider (not the request provider) to ensure correct API key usage
    const actualProvider = savedProvider

    let apiKey: string | undefined

    if (actualProvider === "openai") {
      // OpenAI uses the app's API key from environment variables (base/default option)
      apiKey = process.env.OPENAI_API_KEY
      
      if (!apiKey) {
        return NextResponse.json(
          { error: "OpenAI API key not configured in server environment. Please contact support." },
          { status: 500 }
        )
      }
    } else if (actualProvider === "elevenlabs") {
      // Eleven Labs uses user's stored API key (per-user premium option)
      apiKey = settings?.tts_api_key_encrypted
      
      if (!apiKey) {
        return NextResponse.json(
          { error: "Eleven Labs API key not configured. Please add your API key in voice settings." },
          { status: 400 }
        )
      }
    }

    // Note: We don't validate API key format here because:
    // - Eleven Labs keys can start with "sk_" (underscore) or other formats
    // - OpenAI keys start with "sk-" (hyphen)
    // - Format validation can be too strict and cause false positives
    // - The actual API calls will return proper errors if the key is invalid

    let audioResponse: Response

    // Use actualProvider (from database) instead of provider (from request)
    if (actualProvider === "elevenlabs") {
      // Eleven Labs TTS API
      const elevenLabsVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM" // Default voice: Rachel
      
      audioResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              speed: speed || 1.0,
            },
          }),
        }
      )

      if (!audioResponse.ok) {
        const error = await audioResponse.json().catch(() => ({ error: "Eleven Labs API error" }))
        return NextResponse.json(
          { error: error.error?.message || "Eleven Labs TTS failed" },
          { status: audioResponse.status }
        )
      }
    } else if (actualProvider === "openai") {
      // OpenAI TTS API
      const openaiVoice = voiceId || "alloy" // Default voice: alloy
      
      audioResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: openaiVoice,
          speed: speed || 1.0,
        }),
      })

      if (!audioResponse.ok) {
        const error = await audioResponse.json().catch(() => ({ error: "OpenAI API error" }))
        return NextResponse.json(
          { error: error.error?.message || "OpenAI TTS failed" },
          { status: audioResponse.status }
        )
      }
    } else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
    }

    // Return audio stream
    const audioBlob = await audioResponse.blob()
    return new NextResponse(audioBlob, {
      headers: {
        "Content-Type": audioResponse.headers.get("Content-Type") || "audio/mpeg",
        "Content-Length": audioBlob.size.toString(),
      },
    })
  } catch (error) {
    console.error("TTS API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS request failed" },
      { status: 500 }
    )
  }
}
