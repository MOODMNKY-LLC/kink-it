import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import OpenAI from "openai"

// Backend preset configurations for consistent avatar generation
const AVATAR_GENERATION_PRESETS = {
  artStyle: "digital art, character portrait, fantasy art style, detailed, professional illustration",
  lighting: "dramatic lighting, professional portrait lighting, cinematic lighting",
  composition: "centered composition, character portrait, high detail, professional quality",
  quality: "high quality, 4k resolution, detailed, professional, polished",
  theme: "mature, sophisticated, artistic, tasteful, elegant",
}

function buildAvatarPrompt(characterData: {
  name: string
  appearance_description?: string
  physical_attributes?: Record<string, any>
  archetype?: string
  role_preferences?: string[]
  personality_traits?: string[]
}): string {
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

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { characterData, customPrompt } = body

    if (!characterData || !characterData.name) {
      return NextResponse.json(
        { error: "Character data with name is required" },
        { status: 400 }
      )
    }

    // Build prompt using backend presets
    const prompt = customPrompt || buildAvatarPrompt(characterData)

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey })

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    })

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      )
    }

    // Download and store image in Supabase Storage
    try {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image")
      }

      const arrayBuffer = await imageResponse.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = imageResponse.headers.get("content-type") || "image/png"
      const extension = contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : contentType.includes("webp")
        ? "webp"
        : "png"

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `avatar_${timestamp}.${extension}`
      const filePath = `${profile.id}/kinksters/${filename}`

      // Upload to Supabase Storage
      const supabase = await createClient()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("kinkster-avatars")
        .upload(filePath, buffer, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Error uploading to Supabase Storage:", uploadError)
        // Fallback: return OpenAI URL if storage fails
        return NextResponse.json({
          image_url: imageUrl,
          storage_url: null,
          prompt: prompt,
          generation_config: {
            model: "dall-e-3",
            size: "1024x1024",
            quality: "standard",
          },
          warning: "Image generated but storage upload failed. Using temporary OpenAI URL.",
        })
      }

      // Get public URL from Supabase Storage
      const {
        data: { publicUrl },
      } = supabase.storage.from("kinkster-avatars").getPublicUrl(filePath)

      return NextResponse.json({
        image_url: publicUrl, // Return Supabase Storage URL
        storage_url: publicUrl,
        storage_path: filePath,
        openai_url: imageUrl, // Keep original for reference
        prompt: prompt,
        generation_config: {
          model: "dall-e-3",
          size: "1024x1024",
          quality: "standard",
        },
      })
    } catch (storageError: any) {
      console.error("Error storing image:", storageError)
      // Fallback: return OpenAI URL if storage fails
      return NextResponse.json({
        image_url: imageUrl,
        storage_url: null,
        prompt: prompt,
        generation_config: {
          model: "dall-e-3",
          size: "1024x1024",
          quality: "standard",
        },
        warning: "Image generated but storage upload failed. Using temporary OpenAI URL.",
      })
    }
  } catch (error: any) {
    console.error("Error generating avatar:", error)
    
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate avatar" },
      { status: 500 }
    )
  }
}

