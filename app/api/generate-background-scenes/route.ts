/**
 * API Route: Generate Background Scenes
 * 
 * Generates 5 background scenes using structured prompts and saves them to temp directory.
 * Uses ChatGPT conversation style guide for consistent quality.
 */

import { NextRequest, NextResponse } from "next/server"
import { BACKGROUND_SCENE_TEMPLATES } from "@/lib/playground/background-scenes"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const results: Array<{
      templateId: string
      templateName: string
      imageUrl: string
      tempPath: string
      storagePath: string
      success: boolean
      error?: string
    }> = []

    // Ensure temp directory exists
    const tempDir = join(process.cwd(), "temp")
    try {
      await mkdir(tempDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Generate each background scene
    for (const template of BACKGROUND_SCENE_TEMPLATES) {
      try {
        // Call internal generate-image API
        const formData = new FormData()
        formData.append("mode", "text-to-image")
        formData.append("prompt", template.prompt)
        formData.append("aspectRatio", template.aspectRatio)
        formData.append("model", "gemini-3-pro")

        const baseUrl = request.nextUrl.origin
        const generateResponse = await fetch(`${baseUrl}/api/generate-image`, {
          method: "POST",
          body: formData,
        })

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json()
          throw new Error(errorData.error || `Failed to generate ${template.name}`)
        }

        const generateData = await generateResponse.json()
        const imageUrl = generateData.url

        // Download and save to temp directory
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageUrl}`)
        }

        const arrayBuffer = await imageResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const contentType = imageResponse.headers.get("content-type") || "image/png"
        const extension = contentType.includes("jpeg") || contentType.includes("jpg")
          ? "jpg"
          : contentType.includes("webp")
          ? "webp"
          : "png"

        const filename = `${template.id}.${extension}`
        const tempPath = join(tempDir, filename)

        await writeFile(tempPath, buffer)

        // Extract storage path from URL
        const urlParts = imageUrl.split("/kinkster-avatars/")
        const storagePath = urlParts.length > 1 ? urlParts[1] : `scenes/${template.id}_${Date.now()}.${extension}`

        results.push({
          templateId: template.id,
          templateName: template.name,
          imageUrl,
          tempPath: `temp/${filename}`,
          storagePath,
          success: true,
        })
      } catch (error: any) {
        console.error(`Error generating ${template.name}:`, error)
        results.push({
          templateId: template.id,
          templateName: template.name,
          imageUrl: "",
          tempPath: "",
          storagePath: "",
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      generated: results.filter((r) => r.success).length,
      total: BACKGROUND_SCENE_TEMPLATES.length,
      results,
    })
  } catch (error: any) {
    console.error("Background scene generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate background scenes",
      },
      { status: 500 }
    )
  }
}
