import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"

/**
 * Store an avatar image from a URL (e.g., OpenAI DALL-E) into Supabase Storage
 * Downloads the image and uploads it to the kinkster-avatars bucket
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { image_url, kinkster_id } = body

    if (!image_url) {
      return NextResponse.json(
        { error: "image_url is required" },
        { status: 400 }
      )
    }

    // Download image from URL
    const imageResponse = await fetch(image_url)
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to download image from URL" },
        { status: 500 }
      )
    }

    // Convert to buffer
    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine file extension from content type or URL
    const contentType = imageResponse.headers.get("content-type") || "image/png"
    const extension = contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : contentType.includes("webp")
      ? "webp"
      : "png"

    // Generate unique filename: user_id/kinksters/avatar_{timestamp}_{kinkster_id}.{ext}
    const timestamp = Date.now()
    const filename = kinkster_id
      ? `avatar_${timestamp}_${kinkster_id}.${extension}`
      : `avatar_${timestamp}.${extension}`
    const filePath = `${profile.id}/kinksters/${filename}`

    // Upload to Supabase Storage
    const supabase = await createClient()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("kinkster-avatars")
      .upload(filePath, buffer, {
        contentType,
        cacheControl: "3600", // Cache for 1 hour
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload image to storage" },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("kinkster-avatars").getPublicUrl(filePath)

    return NextResponse.json({
      storage_url: publicUrl,
      storage_path: filePath,
      content_type: contentType,
      size: buffer.length,
    })
  } catch (error: any) {
    console.error("Error storing avatar:", error)
    return NextResponse.json(
      { error: error.message || "Failed to store avatar" },
      { status: 500 }
    )
  }
}
