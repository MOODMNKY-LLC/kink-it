import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Specify Node.js runtime for background removal library
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/image/remove-background
 * Remove background from an image
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Support both JSON and FormData
    let imageUrl: string | null = null
    let imageFile: File | null = null

    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await request.json()
      imageUrl = body.imageUrl || null
    } else if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
      const formData = await request.formData()
      imageUrl = (formData.get("imageUrl") as string) || null
      imageFile = (formData.get("imageFile") as File) || null
    } else {
      // Try FormData first (most common), fallback to JSON
      try {
        const formData = await request.formData()
        imageUrl = (formData.get("imageUrl") as string) || null
        imageFile = (formData.get("imageFile") as File) || null
      } catch {
        // If FormData parsing fails, try JSON
        try {
          const body = await request.json()
          imageUrl = body.imageUrl || null
        } catch {
          return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
        }
      }
    }

    if (!imageUrl && !imageFile) {
      return NextResponse.json({ error: "imageUrl or imageFile is required" }, { status: 400 })
    }

    let imageBuffer: Buffer
    let imageContentType: string = "image/png"

    if (imageFile) {
      // Use uploaded file
      const arrayBuffer = await imageFile.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
      imageContentType = imageFile.type || "image/png"
    } else if (imageUrl) {
      // Fetch image from URL
      const response = await fetch(imageUrl)
      if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 })
      }
      imageContentType = response.headers.get("content-type") || "image/png"
      const arrayBuffer = await response.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    } else {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert image to PNG format using Sharp if needed (background removal works best with PNG/JPEG)
    // The library expects common formats, so we'll ensure it's in a supported format
    let processedImageBuffer: Buffer = imageBuffer
    const supportedFormats = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    const isSupportedFormat = supportedFormats.some(fmt => 
      imageContentType.toLowerCase().includes(fmt.split("/")[1])
    )
    
    // Only attempt Sharp conversion if format is not supported
    if (!isSupportedFormat) {
      try {
        // Import Sharp dynamically (may fail on Windows due to native dependencies)
        const sharpModule = await import("sharp")
        const sharp = sharpModule.default || sharpModule
        console.log(`[RemoveBG] Converting image from ${imageContentType} to PNG using Sharp`)
        processedImageBuffer = await sharp(imageBuffer)
          .png()
          .toBuffer()
        imageContentType = "image/png"
      } catch (sharpError: any) {
        console.warn("[RemoveBG] Sharp conversion failed:", sharpError?.message)
        // If Sharp fails and format is not supported, return error
        return NextResponse.json(
          { 
            error: `Unsupported image format: ${imageContentType}`,
            details: "Please use PNG, JPEG, or WebP format. Sharp conversion failed.",
            supportedFormats: ["PNG", "JPEG", "WebP"]
          },
          { status: 400 }
        )
      }
    } else {
      // Format is already supported, use as-is
      console.log(`[RemoveBG] Image format ${imageContentType} is supported, using as-is`)
    }

    // Remove background - dynamically import for Node.js runtime
    let removeBackground: any
    try {
      // Use dynamic import (works for both ESM and CJS)
      const bgRemovalModule = await import("@imgly/background-removal-node")
      
      // Handle different export formats
      if (typeof bgRemovalModule.removeBackground === 'function') {
        removeBackground = bgRemovalModule.removeBackground
      } else if (typeof bgRemovalModule.default?.removeBackground === 'function') {
        removeBackground = bgRemovalModule.default.removeBackground
      } else if (typeof bgRemovalModule.default === 'function') {
        removeBackground = bgRemovalModule.default
      } else {
        console.error("[RemoveBG] Module structure:", {
          keys: Object.keys(bgRemovalModule),
          hasDefault: !!bgRemovalModule.default,
          defaultType: typeof bgRemovalModule.default,
        })
        return NextResponse.json(
          { error: "Background removal function not found in library module" },
          { status: 500 }
        )
      }
    } catch (importError: any) {
      console.error("[RemoveBG] Failed to import background removal library:", {
        message: importError?.message,
        stack: importError?.stack,
        code: importError?.code,
        name: importError?.name,
        cause: importError?.cause,
      })
      return NextResponse.json(
        { 
          error: "Background removal library not available",
          details: importError?.message || "Unknown import error",
          code: importError?.code || "IMPORT_ERROR"
        },
        { status: 500 }
      )
    }

    // Remove background - the library accepts Blob, File, ImageData, URL, or HTMLImageElement
    let blob: Blob
    try {
      // The library can accept:
      // 1. URL string (easiest - let library fetch it)
      // 2. Blob/File object
      // 3. ImageData
      // 4. HTMLImageElement
      
      // Try URL first if we have one (library handles fetching and format detection)
      if (imageUrl) {
        try {
          console.log("[RemoveBG] Attempting background removal with URL:", imageUrl)
          blob = await removeBackground(imageUrl)
        } catch (urlError: any) {
          console.log("[RemoveBG] URL method failed, trying Blob:", urlError?.message)
          // Fallback to Blob method
          const imageBlob = new Blob([processedImageBuffer], { type: "image/png" })
          blob = await removeBackground(imageBlob)
        }
      } else {
        // Use Blob for file uploads
        const imageBlob = new Blob([processedImageBuffer], { type: "image/png" })
        blob = await removeBackground(imageBlob)
      }
    } catch (removalError: any) {
      console.error("[RemoveBG] Background removal failed:", {
        message: removalError?.message,
        stack: removalError?.stack,
        name: removalError?.name,
      })
      return NextResponse.json(
        { 
          error: `Failed to remove background: ${removalError instanceof Error ? removalError.message : "Unknown error"}`,
          details: removalError?.message || "Format or processing error"
        },
        { status: 500 }
      )
    }

    const processedBuffer = Buffer.from(await blob.arrayBuffer())

    // Upload to Supabase Storage
    // Path structure: {user_id}/processed/{filename} to match RLS policy
    const fileName = `bg-removed-${Date.now()}.png`
    const storagePath = `${user.id}/processed/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generations")
      .upload(storagePath, processedBuffer, {
        contentType: "image/png",
        upsert: false,
      })

    if (uploadError) {
      console.error("[RemoveBG] Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload processed image" }, { status: 500 })
    }

    // Get public URL - transformations will be applied via the image loader
    const {
      data: { publicUrl },
    } = supabase.storage.from("generations").getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      storagePath,
    })
  } catch (error) {
    console.error("[RemoveBG] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}
