import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { buildAvatarPrompt, getFileExtension, KINKY_DEFAULT_PRESET, type CharacterData } from "@/lib/image/shared-utils"

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
    const { characterData, size = "1024x1024", quality = "standard", props } = body

    // Use KINKY default preset if no character data provided
    const finalCharacterData = characterData && characterData.name
      ? { ...characterData, props }
      : { ...KINKY_DEFAULT_PRESET, props }

    if (!finalCharacterData.name) {
      return NextResponse.json(
        { error: "Character data with name is required" },
        { status: 400 }
      )
    }

    // Validate size
    const validSizes = ["1024x1024", "1792x1024", "1024x1792"]
    const imageSize = validSizes.includes(size) ? size : "1024x1024"

    // Validate quality
    const imageQuality = quality === "hd" ? "hd" : "standard"

    // Build prompt using shared utility (automatically optimized, always uses props)
    const prompt = buildAvatarPrompt(finalCharacterData as CharacterData)

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey })

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: imageSize as "1024x1024" | "1792x1024" | "1024x1792",
      quality: imageQuality as "standard" | "hd",
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
      const extension = getFileExtension(contentType)

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
        avatarUrl: publicUrl, // Return Supabase Storage URL
        image_url: publicUrl, // Alias for compatibility
        storage_url: publicUrl,
        storage_path: filePath,
        openai_url: imageUrl, // Keep original for reference
        prompt: prompt,
        generation_config: {
          model: "dall-e-3",
          size: imageSize,
          quality: imageQuality,
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
