import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Specify Node.js runtime for vectorizer library
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/image/vectorize
 * Convert raster image to SVG vector
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

    const formData = await request.formData()
    const imageUrl = formData.get("imageUrl") as string
    const imageFile = formData.get("imageFile") as File | null

    if (!imageUrl && !imageFile) {
      return NextResponse.json({ error: "imageUrl or imageFile is required" }, { status: 400 })
    }

    let imageBuffer: Buffer

    if (imageFile) {
      // Use uploaded file
      const arrayBuffer = await imageFile.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    } else if (imageUrl) {
      // Fetch image from URL
      const response = await fetch(imageUrl)
      if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 })
      }
      const arrayBuffer = await response.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    } else {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Vectorize image - dynamically import for Node.js runtime
    // The library exports imageToSvg as the main function
    let vectorize: any
    try {
      // Use dynamic import (works for both ESM and CJS)
      const vectorizerModule = await import("@imgly/vectorizer")
      
      // Handle different export formats - check for imageToSvg first (correct function name)
      if (typeof vectorizerModule.imageToSvg === 'function') {
        vectorize = vectorizerModule.imageToSvg
      } else if (typeof vectorizerModule.default?.imageToSvg === 'function') {
        vectorize = vectorizerModule.default.imageToSvg
      } else if (typeof vectorizerModule.default === 'function') {
        vectorize = vectorizerModule.default
      } else {
        console.error("[Vectorize] Module structure:", {
          keys: Object.keys(vectorizerModule),
          hasDefault: !!vectorizerModule.default,
          defaultType: typeof vectorizerModule.default,
          hasImageToSvg: typeof vectorizerModule.imageToSvg,
        })
        return NextResponse.json(
          { error: "Vectorize function not found in library module" },
          { status: 500 }
        )
      }
    } catch (importError: any) {
      console.error("[Vectorize] Failed to import vectorizer library:", {
        message: importError?.message,
        stack: importError?.stack,
        code: importError?.code,
        name: importError?.name,
        cause: importError?.cause,
      })
      return NextResponse.json(
        { 
          error: "Vectorizer library not available",
          details: importError?.message || "Unknown import error",
          code: importError?.code || "IMPORT_ERROR"
        },
        { status: 500 }
      )
    }

    // Vectorize image
    // The vectorize function returns a Promise<Blob>, not a string
    // The library has issues with Blob.arrayBuffer() in Node.js
    // Try creating a proper Blob from the buffer first
    let svgBlob: Blob
    
    // Determine content type
    let contentType = "image/png"
    if (imageFile) {
      contentType = imageFile.type || "image/png"
    } else if (imageUrl) {
      // Try to detect from URL or default to PNG
      if (imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")) {
        contentType = "image/jpeg"
      } else if (imageUrl.includes(".webp")) {
        contentType = "image/webp"
      } else if (imageUrl.includes(".png")) {
        contentType = "image/png"
      }
    }
    
    // Build vectorization config - always use high quality
    // Note: Library requires integers >= 1 for threshold values
    const vectorizeConfig: any = {
      options: {
        mode: "spline",
        path_precision: 8, // Maximum path precision for smooth curves
        color_precision: 4, // Maximum color accuracy
        max_iterations: 100, // Maximum iterations for best optimization
        filter_speckle: 1, // Minimal filtering to preserve detail (minimum valid integer)
        corner_threshold: 1, // Minimum threshold for better corner detection (minimum valid integer)
        length_threshold: 1, // Minimum threshold for path detail (minimum valid integer)
        splice_threshold: 1, // Minimum threshold for path optimization (minimum valid integer)
        layer_difference: 1, // Minimum threshold for better layer separation (minimum valid integer)
      },
    }
    
    // Add progress callback for logging
    vectorizeConfig.callbacks = {
      progress: (message: string, current: number, total: number) => {
        console.log(`[Vectorize] Progress: ${message} (${current}/${total})`)
      },
    }
    
    try {
      // Try multiple input formats - the library may work better with different types
      // First try: Uint8Array (most compatible with Node.js)
      console.log("[Vectorize] Attempting vectorization with Uint8Array and config:", JSON.stringify(vectorizeConfig.options))
      const uint8Array = new Uint8Array(imageBuffer)
      svgBlob = await vectorize(uint8Array, vectorizeConfig)
    } catch (uint8ArrayError: any) {
      // Second try: ArrayBuffer
      try {
        console.log("[Vectorize] Uint8Array failed, trying ArrayBuffer:", uint8ArrayError?.message)
        const arrayBuffer = imageBuffer.buffer.slice(
          imageBuffer.byteOffset,
          imageBuffer.byteOffset + imageBuffer.byteLength
        )
        svgBlob = await vectorize(arrayBuffer, vectorizeConfig)
      } catch (arrayBufferError: any) {
        // Third try: Blob
        try {
          console.log("[Vectorize] ArrayBuffer failed, trying Blob:", arrayBufferError?.message)
          const imageBlob = new Blob([imageBuffer], { type: contentType })
          svgBlob = await vectorize(imageBlob, vectorizeConfig)
        } catch (blobError: any) {
          // Fourth try: Data URL
          try {
            console.log("[Vectorize] Blob failed, trying data URL:", blobError?.message)
            const base64 = imageBuffer.toString("base64")
            const dataUrl = `data:${contentType};base64,${base64}`
            svgBlob = await vectorize(dataUrl, vectorizeConfig)
          } catch (dataUrlError: any) {
            console.error("[Vectorize] All vectorization methods failed:", {
              uint8ArrayError: uint8ArrayError?.message,
              arrayBufferError: arrayBufferError?.message,
              blobError: blobError?.message,
              dataUrlError: dataUrlError?.message,
              stack: dataUrlError?.stack,
            })
            // Check if error is the known blob.arrayBuffer issue
            const isBlobArrayBufferError = 
              dataUrlError?.message?.includes('blob.arrayBuffer is not a function') ||
              uint8ArrayError?.message?.includes('blob.arrayBuffer is not a function') ||
              arrayBufferError?.message?.includes('blob.arrayBuffer is not a function') ||
              blobError?.message?.includes('blob.arrayBuffer is not a function')
            
            // Extract Zod validation errors if present
            const zodErrors = dataUrlError?.errors || dataUrlError?.issues || []
            const isZodError = dataUrlError?.name === 'ZodError' || Array.isArray(zodErrors)
            
            return NextResponse.json(
              { 
                error: `Failed to vectorize image: ${dataUrlError instanceof Error ? dataUrlError.message : "Unknown error"}`,
                details: isBlobArrayBufferError 
                  ? "Known library compatibility issue with Node.js runtime. The @imgly/vectorizer library has a bug where it calls blob.arrayBuffer() on objects that don't support it. This feature may need to be disabled or use an alternative library."
                  : isZodError
                  ? `Validation error: ${JSON.stringify(zodErrors)}. Check that all options are valid integers >= 1.`
                  : "Tried Uint8Array, ArrayBuffer, Blob, and data URL formats. The library may not be compatible with Node.js runtime.",
                errorType: dataUrlError?.constructor?.name,
                errorCode: dataUrlError?.code,
                isKnownIssue: isBlobArrayBufferError,
                validationErrors: isZodError ? zodErrors : undefined,
                config: vectorizeConfig.options,
              },
              { status: 500 }
            )
          }
        }
      }
    }

    // Convert Blob to string
    const svgString = await svgBlob.text()

    const svgBuffer = Buffer.from(svgString, "utf-8")

    // Upload to Supabase Storage
    // Path structure: {user_id}/processed/{filename} to match RLS policy
    const fileName = `vectorized-${Date.now()}.svg`
    const storagePath = `${user.id}/processed/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generations")
      .upload(storagePath, svgBuffer, {
        contentType: "image/svg+xml",
        upsert: false,
      })

    if (uploadError) {
      console.error("[Vectorize] Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload vectorized image" }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("generations").getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      storagePath,
      svg: svgString,
    })
  } catch (error) {
    console.error("[Vectorize] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to vectorize image" },
      { status: 500 }
    )
  }
}

