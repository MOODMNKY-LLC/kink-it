/**
 * Supabase Edge Function: Generate Kinkster Avatar
 * 
 * Generates avatar images using OpenAI DALL-E 3 and stores them in Supabase Storage.
 * Uses background tasks for async image processing to respond quickly to clients.
 * 
 * Routes:
 * POST /generate-kinkster-avatar - Generate and store avatar
 */

import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const AVATAR_GENERATION_PRESETS = {
  artStyle: "digital art, character portrait, fantasy art style, detailed, professional illustration",
  lighting: "dramatic lighting, professional portrait lighting, cinematic lighting",
  composition: "centered composition, character portrait, high detail, professional quality",
  quality: "high quality, 4k resolution, detailed, professional, polished",
  theme: "mature, sophisticated, artistic, tasteful, elegant",
}

interface CharacterData {
  name: string
  appearance_description?: string
  physical_attributes?: Record<string, any>
  archetype?: string
  role_preferences?: string[]
  personality_traits?: string[]
}

interface RequestPayload {
  user_id: string
  kinkster_id?: string
  character_data: CharacterData
  custom_prompt?: string
}

function buildAvatarPrompt(characterData: CharacterData): string {
  const {
    name,
    appearance_description,
    physical_attributes,
    archetype,
    role_preferences,
    personality_traits,
  } = characterData

  // Build physical description
  let physicalDesc = appearance_description || ""
  
  if (physical_attributes) {
    const parts: string[] = []
    if (physical_attributes.height) parts.push(`${physical_attributes.height} height`)
    if (physical_attributes.build) parts.push(`${physical_attributes.build} build`)
    if (physical_attributes.hair) parts.push(`${physical_attributes.hair} hair`)
    if (physical_attributes.eyes) parts.push(`${physical_attributes.eyes} eyes`)
    if (physical_attributes.skin_tone) parts.push(`${physical_attributes.skin_tone} skin`)
    
    if (parts.length > 0) {
      physicalDesc = physicalDesc
        ? `${physicalDesc}, ${parts.join(", ")}`
        : parts.join(", ")
    }
  }

  // Build character context
  const contextParts: string[] = []
  if (archetype) contextParts.push(`archetype: ${archetype}`)
  if (role_preferences && role_preferences.length > 0) {
    contextParts.push(`role: ${role_preferences.join(", ")}`)
  }
  if (personality_traits && personality_traits.length > 0) {
    contextParts.push(`personality: ${personality_traits.slice(0, 3).join(", ")}`)
  }

  // Construct final prompt
  const promptParts = [
    AVATAR_GENERATION_PRESETS.artStyle,
    `character portrait of ${name}`,
    physicalDesc || "distinctive appearance",
    contextParts.length > 0 ? `reflecting ${contextParts.join(", ")}` : "",
    "wearing stylish, tasteful clothing",
    "confident pose, expressive eyes",
    AVATAR_GENERATION_PRESETS.lighting,
    AVATAR_GENERATION_PRESETS.composition,
    AVATAR_GENERATION_PRESETS.quality,
    AVATAR_GENERATION_PRESETS.theme,
  ].filter(Boolean)

  return promptParts.join(", ")
}

async function downloadAndStoreImage(
  imageUrl: string,
  userId: string,
  kinksterId: string | undefined,
  supabase: ReturnType<typeof createClient>
): Promise<{ storage_url: string; storage_path: string }> {
  // Download image
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`)
  }

  // Convert to buffer
  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // Determine file extension
  const contentType = imageResponse.headers.get("content-type") || "image/png"
  const extension = contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : contentType.includes("webp")
    ? "webp"
    : "png"

  // Generate unique filename
  const timestamp = Date.now()
  const filename = kinksterId
    ? `avatar_${timestamp}_${kinksterId}.${extension}`
    : `avatar_${timestamp}.${extension}`
  const filePath = `${userId}/kinksters/${filename}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("kinkster-avatars")
    .upload(filePath, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload to storage: ${uploadError.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("kinkster-avatars").getPublicUrl(filePath)

  return {
    storage_url: publicUrl,
    storage_path: filePath,
  }
}

async function broadcastProgress(
  userId: string,
  kinksterId: string | undefined,
  status: "generating" | "downloading" | "uploading" | "completed" | "error",
  message?: string,
  data?: Record<string, any>
) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  const topic = kinksterId
    ? `kinkster:${kinksterId}:avatar`
    : `user:${userId}:avatar`

  await supabase.realtime.send(
    topic,
    "avatar_generation_progress",
    {
      status,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    },
    false // Not a public channel
  )
}

console.info("Kinkster Avatar Generation Edge Function started")

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    const payload: RequestPayload = await req.json()
    const { user_id, kinkster_id, character_data, custom_prompt } = payload

    if (!user_id || !character_data?.name) {
      return new Response(
        JSON.stringify({ error: "user_id and character_data.name are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Get OpenAI API key from secrets
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Build prompt
    const prompt = custom_prompt || buildAvatarPrompt(character_data)

    // Broadcast: Generation started
    await broadcastProgress(user_id, kinkster_id, "generating", "Generating avatar with OpenAI...")

    // Generate image using OpenAI DALL-E 3
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      await broadcastProgress(
        user_id,
        kinkster_id,
        "error",
        `OpenAI API error: ${openaiResponse.statusText}`,
        { error: errorData }
      )
      return new Response(
        JSON.stringify({ error: "Failed to generate image", details: errorData }),
        {
          status: openaiResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const openaiData = await openaiResponse.json()
    const imageUrl = openaiData.data?.[0]?.url

    if (!imageUrl) {
      await broadcastProgress(user_id, kinkster_id, "error", "No image URL returned from OpenAI")
      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Respond immediately with OpenAI URL (temporary)
    // Background task will handle download and storage
    const response = {
      image_url: imageUrl, // Temporary OpenAI URL
      prompt: prompt,
      generation_config: {
        model: "dall-e-3",
        size: "1024x1024",
        quality: "standard",
      },
      status: "processing", // Indicates background processing
      kinkster_id: kinkster_id,
    }

    // Start background task for download and storage
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(
        (async () => {
          try {
            // Broadcast: Downloading
            await broadcastProgress(user_id, kinkster_id, "downloading", "Downloading image...")

            // Download and store image
            const { storage_url, storage_path } = await downloadAndStoreImage(
              imageUrl,
              user_id,
              kinkster_id,
              supabase
            )

            // Broadcast: Uploading
            await broadcastProgress(user_id, kinkster_id, "uploading", "Uploading to storage...")

            // Update kinkster record if kinkster_id provided
            if (kinkster_id) {
              await supabase
                .from("kinksters")
                .update({
                  avatar_url: storage_url,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", kinkster_id)
                .eq("user_id", user_id)
            }

            // Broadcast: Completed
            await broadcastProgress(
              user_id,
              kinkster_id,
              "completed",
              "Avatar generated and stored successfully",
              {
                storage_url,
                storage_path,
              }
            )
          } catch (error: any) {
            console.error("Background task error:", error)
            await broadcastProgress(
              user_id,
              kinkster_id,
              "error",
              `Background processing failed: ${error.message}`,
              { error: error.message }
            )
          }
        })()
      )
    } else {
      // Fallback: Process synchronously if EdgeRuntime.waitUntil not available
      try {
        const { storage_url, storage_path } = await downloadAndStoreImage(
          imageUrl,
          user_id,
          kinkster_id,
          supabase
        )

        if (kinkster_id) {
          await supabase
            .from("kinksters")
            .update({
              avatar_url: storage_url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", kinkster_id)
            .eq("user_id", user_id)
        }

        return new Response(
          JSON.stringify({
            ...response,
            storage_url,
            storage_path,
            status: "completed",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
      } catch (error: any) {
        return new Response(
          JSON.stringify({
            ...response,
            error: error.message,
            status: "error",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
      }
    }

    return new Response(JSON.stringify(response), {
      status: 202, // Accepted - processing in background
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error: any) {
    console.error("Edge Function error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
})

