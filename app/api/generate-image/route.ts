import { type NextRequest, NextResponse } from "next/server"
import { generateText, generateImage } from "ai"
import { openai as openaiProvider } from "@ai-sdk/openai"
import { getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { getCharacterReferenceDataUrls } from "@/lib/playground/character-references"
import { saveImageGeneration } from "@/lib/playground/save-generation"

export const dynamic = "force-dynamic"

// Configure AI SDK to use Vercel AI Gateway
// The AI SDK will automatically use AI_GATEWAY_API_KEY from environment variables
// when making requests to models like "google/gemini-3-pro-image-preview"

const MAX_PROMPT_LENGTH = 5000
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface GenerateImageResponse {
  url: string
  prompt: string
  description?: string
  model: "dalle-3" | "gemini-3-pro"
}

interface ErrorResponse {
  error: string
  message?: string
  details?: string
}

/**
 * Unified Image Generation API Route
 * Supports both DALL-E 3 and Gemini 3 Pro Image Preview
 * 
 * For DALL-E 3: Uses Vercel AI SDK generateImage (primary) with OpenAI SDK fallback
 * For Gemini 3 Pro: Uses Vercel AI Gateway via generateText
 * 
 * All responses are stored in Supabase Storage and return storage URLs
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json<ErrorResponse>(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Create Supabase client early (needed for image downloads)
    const supabase = await createClient()

    const formData = await request.formData()
    const mode = formData.get("mode") as string
    const prompt = formData.get("prompt") as string
    const aspectRatio = formData.get("aspectRatio") as string
    const modelParam = formData.get("model") as string | null // "dalle-3" or "gemini-3-pro"
    const characterIdsParam = formData.get("characterIds") as string | null // Comma-separated character IDs

    // Default to Gemini 3 Pro if no model specified (matches nano banana workflow)
    const model = modelParam === "dalle-3" ? "dalle-3" : "gemini-3-pro"
    
    // Parse character IDs if provided
    const characterIds = characterIdsParam
      ? characterIdsParam.split(",").map((id) => id.trim()).filter(Boolean)
      : []

    if (!mode) {
      return NextResponse.json<ErrorResponse>({ error: "Mode is required" }, { status: 400 })
    }

    // Handle pose-variation mode (two-image workflow: character + pose reference)
    if (mode === "pose-variation") {
      const characterUrl = formData.get("characterUrl") as string
      const poseReferenceUrl = formData.get("poseReferenceUrl") as string
      const poseDescription = formData.get("poseDescription") as string | null

      if (!characterUrl || !poseReferenceUrl) {
        return NextResponse.json<ErrorResponse>(
          { error: "Pose variation requires characterUrl and poseReferenceUrl" },
          { status: 400 }
        )
      }

      // Pose variation must use Gemini 3 Pro for multi-image support
      const apiKey = process.env.AI_GATEWAY_API_KEY
      if (!apiKey) {
        return NextResponse.json<ErrorResponse>(
          {
            error: "Configuration error",
            details: "No AI Gateway API key configured. Pose variation requires Gemini 3 Pro.",
          },
          { status: 500 }
        )
      }

      const geminiAspectRatioMap: Record<string, string> = {
        portrait: "9:16",
        landscape: "16:9",
        wide: "21:9",
        "4:3": "4:3",
        "3:4": "3:4",
        "3:2": "3:2",
        "2:3": "2:3",
        "5:4": "5:4",
        "4:5": "4:5",
        square: "1:1",
      }

      const geminiAspectRatio = geminiAspectRatioMap[aspectRatio] || aspectRatio || "1:1"
      const geminiModel = "google/gemini-3-pro-image-preview"

      // Convert URLs to data URLs for Gemini
      // Handles localhost/127.0.0.1 routing issues and certificate problems
      const convertToDataUrl = async (url: string): Promise<string> => {
        try {
          // Normalize URL: replace localhost with 127.0.0.1 for consistency
          let normalizedUrl = url.replace(/localhost/g, "127.0.0.1")
          
          // Check if this is a Supabase Storage URL
          const isSupabaseStorage = normalizedUrl.includes("/storage/v1/object/public") || 
                                    normalizedUrl.includes("supabase.co/storage") ||
                                    (normalizedUrl.includes("127.0.0.1") && normalizedUrl.includes("/storage/"))
          
          let arrayBuffer: ArrayBuffer
          let contentType: string = "image/jpeg"
          
          if (isSupabaseStorage) {
            // Use Supabase client to download (handles auth/certificates better)
            try {
              // Extract storage path from URL
              // Format: https://127.0.0.1:55321/storage/v1/object/public/kinkster-avatars/path/to/file
              const storageMatch = normalizedUrl.match(/\/storage\/v1\/object\/public\/([^?]+)/)
              if (storageMatch) {
                const storagePath = storageMatch[1]
                const bucketMatch = storagePath.match(/^([^/]+)\/(.+)$/)
                if (bucketMatch) {
                  const [, bucket, path] = bucketMatch
                  const { data, error } = await supabase.storage
                    .from(bucket)
                    .download(path)
                  
                  if (error) throw error
                  if (!data) throw new Error("No data returned from storage")
                  
                  arrayBuffer = await data.arrayBuffer()
                  contentType = data.type || "image/jpeg"
                } else {
                  throw new Error("Invalid storage path format")
                }
              } else {
                // Fallback to fetch if we can't parse the path
                throw new Error("Could not parse Supabase Storage URL")
              }
            } catch (supabaseError) {
              console.warn("Supabase client download failed, falling back to fetch:", supabaseError)
              // Fallback to regular fetch with better error handling
              const response = await fetch(normalizedUrl)
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
              }
              arrayBuffer = await response.arrayBuffer()
              contentType = response.headers.get("content-type") || "image/jpeg"
            }
          } else {
            // Regular URL - use fetch
            const response = await fetch(normalizedUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
            }
            arrayBuffer = await response.arrayBuffer()
            contentType = response.headers.get("content-type") || "image/jpeg"
          }
          
          const buffer = Buffer.from(arrayBuffer)
          const base64 = buffer.toString("base64")
          return `data:${contentType};base64,${base64}`
        } catch (error) {
          console.error("Error converting URL to data URL:", url, error)
          throw new Error(`Failed to convert image URL to data URL: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      const characterDataUrl = await convertToDataUrl(characterUrl)
      const poseReferenceDataUrl = await convertToDataUrl(poseReferenceUrl)

      // Use structured prompt if provided, otherwise build simple prompt
      // Structured prompts from buildStructuredPosePrompt() already include all necessary instructions
      const poseTransferPrompt = poseDescription || `Transfer the pose from the reference image to this character while maintaining their exact appearance, facial features, clothing, and style. The character should adopt the pose naturally while preserving all their unique characteristics.`

      const messageParts: Array<{ type: "text" | "image"; text?: string; image?: string }> = [
        { type: "image", image: characterDataUrl },
        { type: "image", image: poseReferenceDataUrl },
        { type: "text", text: poseTransferPrompt },
      ]

      const result = await generateText({
        model: geminiModel,
        messages: [
          {
            role: "user",
            // @ts-ignore - Type issue with content parts
            content: messageParts,
          },
        ],
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: geminiAspectRatio,
            },
          },
        },
      })

      const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

      if (imageFiles.length === 0) {
        return NextResponse.json<ErrorResponse>(
          { error: "No image generated", details: "The model did not return any images" },
          { status: 500 }
        )
      }

      const firstImage = imageFiles[0]
      const base64Data = firstImage.base64
      const mediaType = firstImage.mediaType || "image/png"

      // Return data URL directly (like nano banana) for immediate display
      const dataUrl = `data:${mediaType};base64,${base64Data}`

      // Optionally upload to storage in background (non-blocking)
      const uploadToStorage = async () => {
        try {
          const buffer = Buffer.from(base64Data, "base64")
          const extension = mediaType.includes("jpeg") || mediaType.includes("jpg")
            ? "jpg"
            : mediaType.includes("webp")
            ? "webp"
            : "png"

          const timestamp = Date.now()
          const filename = `pose_variation_${timestamp}.${extension}`
          const filePath = `${profile.id}/pose-variations/${filename}`

          const { error: uploadError } = await supabase.storage
            .from("kinkster-avatars")
            .upload(filePath, buffer, {
              contentType: mediaType,
              cacheControl: "3600",
              upsert: false,
            })

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("kinkster-avatars").getPublicUrl(filePath)
            // Could save to database here if needed
          }
        } catch (error) {
          console.error("Background storage upload failed:", error)
        }
      }

      uploadToStorage().catch(() => {})

      return NextResponse.json<GenerateImageResponse>({
        url: dataUrl,
        prompt: poseTransferPrompt,
        description: result.text || "",
        model: "gemini-3-pro",
      })
    }

    // Handle scene-composition mode (three-image workflow: 2 characters + background)
    if (mode === "scene-composition") {
      const character1Url = formData.get("character1Url") as string
      const character2Url = formData.get("character2Url") as string
      const backgroundUrl = formData.get("backgroundUrl") as string

      if (!character1Url || !character2Url || !backgroundUrl) {
        return NextResponse.json<ErrorResponse>(
          { error: "Scene composition requires character1Url, character2Url, and backgroundUrl" },
          { status: 400 }
        )
      }

      if (!prompt?.trim()) {
        return NextResponse.json<ErrorResponse>(
          { error: "Composition prompt is required" },
          { status: 400 }
        )
      }

      // Scene composition must use Gemini 3 Pro for multi-image support
      const apiKey = process.env.AI_GATEWAY_API_KEY
      if (!apiKey) {
        return NextResponse.json<ErrorResponse>(
          {
            error: "Configuration error",
            details: "No AI Gateway API key configured. Scene composition requires Gemini 3 Pro.",
          },
          { status: 500 }
        )
      }

      const geminiAspectRatioMap: Record<string, string> = {
        portrait: "9:16",
        landscape: "16:9",
        wide: "21:9",
        "4:3": "4:3",
        "3:4": "3:4",
        "3:2": "3:2",
        "2:3": "2:3",
        "5:4": "5:4",
        "4:5": "4:5",
        square: "1:1",
      }

      const geminiAspectRatio = geminiAspectRatioMap[aspectRatio] || aspectRatio || "16:9"
      const geminiModel = "google/gemini-3-pro-image-preview"

      // Convert URLs to data URLs for Gemini
      // Handles localhost/127.0.0.1 routing issues and certificate problems
      const convertToDataUrl = async (url: string): Promise<string> => {
        try {
          // Normalize URL: replace localhost with 127.0.0.1 for consistency
          let normalizedUrl = url.replace(/localhost/g, "127.0.0.1")
          
          // Check if this is a Supabase Storage URL
          const isSupabaseStorage = normalizedUrl.includes("/storage/v1/object/public") || 
                                    normalizedUrl.includes("supabase.co/storage") ||
                                    (normalizedUrl.includes("127.0.0.1") && normalizedUrl.includes("/storage/"))
          
          let arrayBuffer: ArrayBuffer
          let contentType: string = "image/jpeg"
          
          if (isSupabaseStorage) {
            // Use Supabase client to download (handles auth/certificates better)
            try {
              // Extract storage path from URL
              // Format: https://127.0.0.1:55321/storage/v1/object/public/kinkster-avatars/path/to/file
              const storageMatch = normalizedUrl.match(/\/storage\/v1\/object\/public\/([^?]+)/)
              if (storageMatch) {
                const storagePath = storageMatch[1]
                const bucketMatch = storagePath.match(/^([^/]+)\/(.+)$/)
                if (bucketMatch) {
                  const [, bucket, path] = bucketMatch
                  const { data, error } = await supabase.storage
                    .from(bucket)
                    .download(path)
                  
                  if (error) throw error
                  if (!data) throw new Error("No data returned from storage")
                  
                  arrayBuffer = await data.arrayBuffer()
                  contentType = data.type || "image/jpeg"
                } else {
                  throw new Error("Invalid storage path format")
                }
              } else {
                // Fallback to fetch if we can't parse the path
                throw new Error("Could not parse Supabase Storage URL")
              }
            } catch (supabaseError) {
              console.warn("Supabase client download failed, falling back to fetch:", supabaseError)
              // Fallback to regular fetch with better error handling
              const response = await fetch(normalizedUrl)
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
              }
              arrayBuffer = await response.arrayBuffer()
              contentType = response.headers.get("content-type") || "image/jpeg"
            }
          } else {
            // Regular URL - use fetch
            const response = await fetch(normalizedUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
            }
            arrayBuffer = await response.arrayBuffer()
            contentType = response.headers.get("content-type") || "image/jpeg"
          }
          
          const buffer = Buffer.from(arrayBuffer)
          const base64 = buffer.toString("base64")
          return `data:${contentType};base64,${base64}`
        } catch (error) {
          console.error("Error converting URL to data URL:", url, error)
          throw new Error(`Failed to convert image URL to data URL: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      const character1DataUrl = await convertToDataUrl(character1Url)
      const character2DataUrl = await convertToDataUrl(character2Url)
      const backgroundDataUrl = await convertToDataUrl(backgroundUrl)

      // Use structured prompt if provided (from buildStructuredCompositionPrompt)
      // Structured prompts already include composition instructions
      // Otherwise, build simple composition prompt
      const compositionPrompt = prompt.includes("Character") && prompt.includes("canon")
        ? prompt // Structured prompt already complete
        : `${prompt}. Place these two characters in the provided background scene, maintaining character consistency and proper lighting that matches the environment.`

      const messageParts: Array<{ type: "text" | "image"; text?: string; image?: string }> = [
        { type: "image", image: character1DataUrl },
        { type: "image", image: character2DataUrl },
        { type: "image", image: backgroundDataUrl },
        { type: "text", text: compositionPrompt },
      ]

      const result = await generateText({
        model: geminiModel,
        messages: [
          {
            role: "user",
            // @ts-ignore - Type issue with content parts
            content: messageParts,
          },
        ],
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: geminiAspectRatio,
            },
          },
        },
      })

      const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

      if (imageFiles.length === 0) {
        return NextResponse.json<ErrorResponse>(
          { error: "No image generated", details: "The model did not return any images" },
          { status: 500 }
        )
      }

      const firstImage = imageFiles[0]
      const base64Data = firstImage.base64
      const mediaType = firstImage.mediaType || "image/png"

      // Return data URL directly (like nano banana) for immediate display
      const dataUrl = `data:${mediaType};base64,${base64Data}`

      // Optionally upload to storage in background (non-blocking)
      const uploadToStorage = async () => {
        try {
          const buffer = Buffer.from(base64Data, "base64")
          const extension = mediaType.includes("jpeg") || mediaType.includes("jpg")
            ? "jpg"
            : mediaType.includes("webp")
            ? "webp"
            : "png"

          const timestamp = Date.now()
          const filename = `composition_${timestamp}.${extension}`
          const filePath = `${profile.id}/compositions/${filename}`

          const { error: uploadError } = await supabase.storage
            .from("kinkster-avatars")
            .upload(filePath, buffer, {
              contentType: mediaType,
              cacheControl: "3600",
              upsert: false,
            })

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("kinkster-avatars").getPublicUrl(filePath)
            // Could save to database here if needed
          }
        } catch (error) {
          console.error("Background storage upload failed:", error)
        }
      }

      uploadToStorage().catch(() => {})

      return NextResponse.json<GenerateImageResponse>({
        url: dataUrl,
        prompt: compositionPrompt,
        description: result.text || "",
        model: "gemini-3-pro",
      })
    }

    if (!prompt?.trim()) {
      return NextResponse.json<ErrorResponse>({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json<ErrorResponse>(
        { error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` },
        { status: 400 }
      )
    }

    if (model === "dalle-3") {
      // DALL-E 3 path - Use Vercel AI SDK as primary, OpenAI SDK as fallback
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        return NextResponse.json<ErrorResponse>(
          {
            error: "Configuration error",
            details: "No OpenAI API key configured. Please add OPENAI_API_KEY to environment variables.",
          },
          { status: 500 }
        )
      }

      // Validate size from aspect ratio
      const sizeMap: Record<string, "1024x1024" | "1792x1024" | "1024x1792"> = {
        square: "1024x1024",
        portrait: "1024x1792",
        landscape: "1792x1024",
        wide: "1792x1024",
        "4:3": "1024x1024",
        "3:4": "1024x1792",
        "3:2": "1792x1024",
        "2:3": "1024x1792",
        "5:4": "1024x1024",
        "4:5": "1024x1792",
      }

      const imageSize = sizeMap[aspectRatio] || "1024x1024"

      let imageBuffer: Buffer
      let contentType: string = "image/png"

      try {
        // Primary: Use Vercel AI SDK generateImage
        const { image, providerMetadata } = await generateImage({
          model: openaiProvider.image("dall-e-3"),
          prompt: prompt,
          size: imageSize,
          providerOptions: {
            openai: {
              quality: "standard",
            },
          },
        })

        // Get image as buffer - handle different image types
        try {
          // Try asBuffer() method first (Vercel AI SDK standard)
          if (typeof image.asBuffer === "function") {
            imageBuffer = Buffer.from(await image.asBuffer())
          } else if (typeof image.toDataURL === "function") {
            // Fallback: convert data URL to buffer
            const dataUrl = await image.toDataURL()
            const base64Data = dataUrl.split(",")[1]
            imageBuffer = Buffer.from(base64Data, "base64")
          } else if (image instanceof Blob || image instanceof File) {
            // Fallback: convert Blob/File to buffer
            const arrayBuffer = await image.arrayBuffer()
            imageBuffer = Buffer.from(arrayBuffer)
          } else {
            // Last resort: try to get base64 or arrayBuffer from image
            const arrayBuffer = await (image as any).arrayBuffer?.() || await (image as any).buffer
            imageBuffer = arrayBuffer ? Buffer.from(arrayBuffer) : Buffer.from([])
          }
        } catch (bufferError) {
          console.error("Error converting image to buffer:", bufferError)
          // Try alternative conversion
          try {
            const arrayBuffer = await (image as any).arrayBuffer()
            imageBuffer = Buffer.from(arrayBuffer)
          } catch (fallbackError) {
            console.error("Fallback buffer conversion failed:", fallbackError)
            throw new Error("Failed to convert image to buffer")
          }
        }
        contentType = image.mediaType || (image as any).type || "image/png"

        // Log revised prompt if available
        const revisedPrompt = providerMetadata?.openai?.images?.[0]?.revisedPrompt
        if (revisedPrompt) {
          console.log("OpenAI revised prompt:", revisedPrompt)
        }
      } catch (error) {
        // Fallback: Use direct OpenAI SDK
        console.warn("Vercel AI SDK failed, falling back to direct OpenAI SDK:", error)
        
        const openai = new OpenAI({ apiKey })
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          size: imageSize,
          quality: "standard",
          n: 1,
        })

        const imageUrl = response.data[0]?.url
        if (!imageUrl) {
          return NextResponse.json<ErrorResponse>(
            { error: "No image generated", details: "DALL-E 3 did not return any images" },
            { status: 500 }
          )
        }

        // Download image from URL
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error("Failed to download generated image")
        }

        const arrayBuffer = await imageResponse.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
        contentType = imageResponse.headers.get("content-type") || "image/png"
      }

      // Determine file extension
      const extension = contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : contentType.includes("webp")
        ? "webp"
        : "png"

      const timestamp = Date.now()
      const filename = `generated_${timestamp}.${extension}`
      const filePath = `${profile.id}/playground/${filename}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("kinkster-avatars")
        .upload(filePath, imageBuffer, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Error uploading to Supabase Storage:", uploadError)
        // Return error - we can't return OpenAI URL since we have buffer
        return NextResponse.json<ErrorResponse>(
          { error: "Storage error", details: "Failed to upload image to storage" },
          { status: 500 }
        )
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("kinkster-avatars").getPublicUrl(filePath)

      return NextResponse.json<GenerateImageResponse>({
        url: publicUrl,
        prompt: prompt,
        model: "dalle-3",
      })
    } else {
      // Gemini 3 Pro Image Preview path via Vercel AI Gateway
      const apiKey = process.env.AI_GATEWAY_API_KEY

      if (!apiKey) {
        return NextResponse.json<ErrorResponse>(
          {
            error: "Configuration error",
            details: "No AI Gateway API key configured. Please add AI_GATEWAY_API_KEY to environment variables.",
          },
          { status: 500 }
        )
      }

      const geminiAspectRatioMap: Record<string, string> = {
        portrait: "9:16",
        landscape: "16:9",
        wide: "21:9",
        "4:3": "4:3",
        "3:4": "3:4",
        "3:2": "3:2",
        "2:3": "2:3",
        "5:4": "5:4",
        "4:5": "4:5",
        square: "1:1",
      }

      const geminiAspectRatio = geminiAspectRatioMap[aspectRatio] || "1:1"
      const geminiModel = "google/gemini-3-pro-image-preview"

      if (mode === "text-to-image") {
        // Fetch character reference images if character IDs provided
        let characterReferenceDataUrls: string[] = []
        if (characterIds.length > 0) {
          try {
            characterReferenceDataUrls = await getCharacterReferenceDataUrls(characterIds)
          } catch (error) {
            console.error("Failed to fetch character references:", error)
            // Continue without references
          }
        }

        // Build prompt like nano-banana - simple and clean
        const imageGenerationPrompt = `Generate a high-quality image based on this description: ${prompt}. The image should be visually appealing and match the description as closely as possible.`

        // Build message parts with character references if available
        const messageParts: Array<{ type: "text" | "image"; text?: string; image?: string }> = []
        
        // Add character reference images first (up to 5 for Gemini)
        for (const refDataUrl of characterReferenceDataUrls.slice(0, 5)) {
          messageParts.push({ type: "image", image: refDataUrl })
        }
        
        // Add prompt
        messageParts.push({ type: "text", text: imageGenerationPrompt })

        const result = await generateText({
          model: geminiModel,
          messages: characterReferenceDataUrls.length > 0
            ? [
                {
                  role: "user",
                  // @ts-ignore - Type issue with content parts
                  content: messageParts,
                },
              ]
            : [
                {
                  role: "user",
                  content: imageGenerationPrompt,
                },
              ],
          providerOptions: {
            google: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                aspectRatio: geminiAspectRatio,
              },
            },
          },
        })

        const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

        if (imageFiles.length === 0) {
          return NextResponse.json<ErrorResponse>(
            { error: "No image generated", details: "The model did not return any images" },
            { status: 500 }
          )
        }

        const firstImage = imageFiles[0]
        const base64Data = firstImage.base64
        const mediaType = firstImage.mediaType || "image/png"

        // Return data URL directly (like nano banana) for immediate display
        // This avoids CORS issues and storage upload delays
        const dataUrl = `data:${mediaType};base64,${base64Data}`

        // Optionally upload to storage in background (non-blocking)
        // This allows persistence without blocking the response
        const uploadToStorage = async () => {
          try {
            const buffer = Buffer.from(base64Data, "base64")
            const extension = mediaType.includes("jpeg") || mediaType.includes("jpg")
              ? "jpg"
              : mediaType.includes("webp")
              ? "webp"
              : "png"

            const timestamp = Date.now()
            const filename = `generated_${timestamp}.${extension}`
            const filePath = `${profile.id}/playground/${filename}`

            const { error: uploadError } = await supabase.storage
              .from("kinkster-avatars")
              .upload(filePath, buffer, {
                contentType: mediaType,
                cacheControl: "3600",
                upsert: false,
              })

            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("kinkster-avatars").getPublicUrl(filePath)

              // Save to image_generations table
              try {
                await saveImageGeneration({
                  userId: profile.id,
                  generationType: "other",
                  prompt: imageGenerationPrompt,
                  storagePath: filePath,
                  imageUrl: publicUrl,
                  model: "gemini-3-pro",
                  aspectRatio: geminiAspectRatio,
                  config: {
                    mode: "text-to-image",
                    aspectRatio: geminiAspectRatio,
                  },
                  entityLinks: characterIds.map((id) => ({
                    entityType: "kinkster",
                    entityId: id,
                  })),
                })
              } catch (error) {
                console.error("Failed to save generation to database:", error)
              }
            }
          } catch (error) {
            console.error("Background storage upload failed:", error)
            // Don't throw - this is background operation
          }
        }

        // Start background upload (don't await)
        uploadToStorage().catch(() => {
          // Silently fail - data URL is already returned
        })

        // Return data URL immediately (like nano banana)
        return NextResponse.json<GenerateImageResponse>({
          url: dataUrl,
          prompt: prompt,
          description: result.text || "",
          model: "gemini-3-pro",
        })
      } else if (mode === "image-editing") {
        const image1 = formData.get("image1") as File
        const image2 = formData.get("image2") as File
        const image1Url = formData.get("image1Url") as string
        const image2Url = formData.get("image2Url") as string

        const hasImage1 = image1 || image1Url
        const hasImage2 = image2 || image2Url

        if (!hasImage1) {
          return NextResponse.json<ErrorResponse>(
            { error: "At least one image is required for editing mode" },
            { status: 400 }
          )
        }

        if (image1) {
          if (image1.size > MAX_FILE_SIZE) {
            return NextResponse.json<ErrorResponse>(
              { error: `Image 1 too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
              { status: 400 }
            )
          }
          if (!ALLOWED_IMAGE_TYPES.includes(image1.type)) {
            return NextResponse.json<ErrorResponse>(
              { error: "Image 1 has invalid format. Allowed: JPEG, PNG, WebP, GIF" },
              { status: 400 }
            )
          }
        }

        if (image2) {
          if (image2.size > MAX_FILE_SIZE) {
            return NextResponse.json<ErrorResponse>(
              { error: `Image 2 too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
              { status: 400 }
            )
          }
          if (!ALLOWED_IMAGE_TYPES.includes(image2.type)) {
            return NextResponse.json<ErrorResponse>(
              { error: "Image 2 has invalid format. Allowed: JPEG, PNG, WebP, GIF" },
              { status: 400 }
            )
          }
        }

        const convertToDataUrl = async (source: File | string): Promise<string> => {
          if (typeof source === "string") {
            // Handle URL strings - normalize localhost and use Supabase client for storage URLs
            try {
              // Normalize URL: replace localhost with 127.0.0.1 for consistency
              let normalizedUrl = source.replace(/localhost/g, "127.0.0.1")
              
              // Check if this is a Supabase Storage URL
              const isSupabaseStorage = normalizedUrl.includes("/storage/v1/object/public") || 
                                        normalizedUrl.includes("supabase.co/storage") ||
                                        (normalizedUrl.includes("127.0.0.1") && normalizedUrl.includes("/storage/"))
              
              let arrayBuffer: ArrayBuffer
              let contentType: string = "image/jpeg"
              
              if (isSupabaseStorage) {
                // Use Supabase client to download (handles auth/certificates better)
                try {
                  // Extract storage path from URL
                  const storageMatch = normalizedUrl.match(/\/storage\/v1\/object\/public\/([^?]+)/)
                  if (storageMatch) {
                    const storagePath = storageMatch[1]
                    const bucketMatch = storagePath.match(/^([^/]+)\/(.+)$/)
                    if (bucketMatch) {
                      const [, bucket, path] = bucketMatch
                      const { data, error } = await supabase.storage
                        .from(bucket)
                        .download(path)
                      
                      if (error) throw error
                      if (!data) throw new Error("No data returned from storage")
                      
                      arrayBuffer = await data.arrayBuffer()
                      contentType = data.type || "image/jpeg"
                    } else {
                      throw new Error("Invalid storage path format")
                    }
                  } else {
                    throw new Error("Could not parse Supabase Storage URL")
                  }
                } catch (supabaseError) {
                  console.warn("Supabase client download failed, falling back to fetch:", supabaseError)
                  // Fallback to regular fetch
                  const response = await fetch(normalizedUrl)
                  if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
                  }
                  arrayBuffer = await response.arrayBuffer()
                  contentType = response.headers.get("content-type") || "image/jpeg"
                }
              } else {
                // Regular URL - use fetch
                const response = await fetch(normalizedUrl)
                if (!response.ok) {
                  throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
                }
                arrayBuffer = await response.arrayBuffer()
                contentType = response.headers.get("content-type") || "image/jpeg"
              }
              
              const buffer = Buffer.from(arrayBuffer)
              const base64 = buffer.toString("base64")
              return `data:${contentType};base64,${base64}`
            } catch (error) {
              console.error("Error converting URL to data URL:", source, error)
              throw new Error(`Failed to convert image URL to data URL: ${error instanceof Error ? error.message : String(error)}`)
            }
          } else {
            // Handle File objects
            const arrayBuffer = await source.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const base64 = buffer.toString("base64")
            return `data:${source.type};base64,${base64}`
          }
        }

        // Fetch character reference images if character IDs provided
        let characterReferenceDataUrls: string[] = []
        if (characterIds.length > 0 && model === "gemini-3-pro") {
          try {
            characterReferenceDataUrls = await getCharacterReferenceDataUrls(characterIds)
          } catch (error) {
            console.error("Failed to fetch character references:", error)
            // Continue without references
          }
        }

        const image1DataUrl = await convertToDataUrl(hasImage1 ? image1 || image1Url : "")
        const image2DataUrl = hasImage2 ? await convertToDataUrl(image2 || image2Url) : null

        const messageParts: Array<{ type: "text" | "image"; text?: string; image?: string }> = []

        // Add character reference images first (up to 5 for Gemini, but limit total images to 14)
        // Reserve space for image1, image2, and character references
        const maxCharacterRefs = Math.min(5, 14 - (hasImage1 ? 1 : 0) - (hasImage2 ? 1 : 0))
        for (const refDataUrl of characterReferenceDataUrls.slice(0, maxCharacterRefs)) {
          messageParts.push({ type: "image", image: refDataUrl })
        }

        // Add user-provided images
        messageParts.push({ type: "image", image: image1DataUrl })
        if (image2DataUrl) {
          messageParts.push({ type: "image", image: image2DataUrl })
        }

        const editingPrompt = hasImage2
          ? `${prompt}. Combine these two images creatively while following the instructions.`
          : `${prompt}. Edit or transform this image based on the instructions.`

        messageParts.push({ type: "text", text: editingPrompt })

        const result = await generateText({
          model: geminiModel,
          messages: [
            {
              role: "user",
              // @ts-ignore - Type issue with content parts
              content: messageParts,
            },
          ],
          providerOptions: {
            google: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                aspectRatio: geminiAspectRatio,
              },
            },
          },
        })

        const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

        if (imageFiles.length === 0) {
          return NextResponse.json<ErrorResponse>(
            { error: "No image generated", details: "The model did not return any images" },
            { status: 500 }
          )
        }

        const firstImage = imageFiles[0]
        const base64Data = firstImage.base64
        const mediaType = firstImage.mediaType || "image/png"

        // Return data URL directly (like nano banana) for immediate display
        // This avoids CORS issues and storage upload delays
        const dataUrl = `data:${mediaType};base64,${base64Data}`

        // Optionally upload to storage in background (non-blocking)
        const uploadToStorage = async () => {
          try {
            const buffer = Buffer.from(base64Data, "base64")
            const extension = mediaType.includes("jpeg") || mediaType.includes("jpg")
              ? "jpg"
              : mediaType.includes("webp")
              ? "webp"
              : "png"

            const timestamp = Date.now()
            const filename = `generated_${timestamp}.${extension}`
            const filePath = `${profile.id}/playground/${filename}`

            const { error: uploadError } = await supabase.storage
              .from("kinkster-avatars")
              .upload(filePath, buffer, {
                contentType: mediaType,
                cacheControl: "3600",
                upsert: false,
              })

            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("kinkster-avatars").getPublicUrl(filePath)

              // Save to image_generations table
              try {
                await saveImageGeneration({
                  userId: profile.id,
                  generationType: "other",
                  prompt: editingPrompt,
                  storagePath: filePath,
                  imageUrl: publicUrl,
                  model: "gemini-3-pro",
                  aspectRatio: geminiAspectRatio,
                  config: {
                    mode: "image-editing",
                    aspectRatio: geminiAspectRatio,
                    hasImage1: !!hasImage1,
                    hasImage2: !!hasImage2,
                  },
                  entityLinks: characterIds.map((id) => ({
                    entityType: "kinkster",
                    entityId: id,
                  })),
                })
              } catch (error) {
                console.error("Failed to save generation to database:", error)
              }
            }
          } catch (error) {
            console.error("Background storage upload failed:", error)
            // Don't throw - this is background operation
          }
        }

        // Start background upload (don't await)
        uploadToStorage().catch(() => {
          // Silently fail - data URL is already returned
        })

        // Return data URL immediately (like nano banana)
        return NextResponse.json<GenerateImageResponse>({
          url: dataUrl,
          prompt: editingPrompt,
          description: result.text || "",
          model: "gemini-3-pro",
        })
      } else {
        return NextResponse.json<ErrorResponse>(
          { error: "Invalid mode", details: "Mode must be 'text-to-image' or 'image-editing'" },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    console.error("Error in generate-image route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to generate image",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

