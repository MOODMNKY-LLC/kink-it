/**
 * Generate Background Scene Images
 * 
 * Script to generate 5 background scenes and save them to temp directory.
 * Uses structured prompts following ChatGPT conversation style guide.
 * 
 * Usage:
 *   npm run generate:backgrounds
 *   or
 *   tsx scripts/generate-background-scenes.ts
 * 
 * Requirements:
 *   - Next.js dev server running (for API calls)
 *   - Or AI_GATEWAY_API_KEY in environment
 *   - Authenticated session (if using API route)
 */

import { BACKGROUND_SCENE_TEMPLATES } from "@/lib/playground/background-scenes"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

/**
 * Generate a single background scene via API
 * 
 * Note: This requires the Next.js server to be running and an authenticated session.
 * For production use, consider creating an internal API route or using service account.
 */
async function generateBackgroundScene(
  template: typeof BACKGROUND_SCENE_TEMPLATES[0],
  baseUrl: string = "http://localhost:3000"
): Promise<{
  url: string
  prompt: string
}> {
  const formData = new FormData()
  formData.append("mode", "text-to-image")
  formData.append("prompt", template.prompt)
  formData.append("aspectRatio", template.aspectRatio)
  formData.append("model", "gemini-3-pro")

  console.log(`  Calling API: ${baseUrl}/api/generate-image`)
  const response = await fetch(`${baseUrl}/api/generate-image`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || errorData.details || `Failed to generate ${template.name} (${response.status})`)
  }

  const data = await response.json()
  return {
    url: data.url,
    prompt: template.prompt,
  }
}

/**
 * Download image from URL and save to temp directory
 */
async function saveImageToTemp(url: string, filename: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${url}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = response.headers.get("content-type") || "image/png"
  const extension = contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : contentType.includes("webp")
    ? "webp"
    : "png"

  const fullFilename = `${filename}.${extension}`
  const tempPath = join(process.cwd(), "temp", fullFilename)

  await writeFile(tempPath, buffer)
  return tempPath
}

/**
 * Save scene to database
 */
async function saveSceneToDatabase(
  template: typeof BACKGROUND_SCENE_TEMPLATES[0],
  imageUrl: string,
  storagePath: string,
  baseUrl: string = "http://localhost:3000"
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/scenes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: template.name,
      scene_type: template.sceneType,
      aspect_ratio: template.aspectRatio,
      tags: template.tags,
      generation_prompt: template.prompt,
      image_url: imageUrl,
      storage_path: storagePath,
      generation_config: {
        model: "gemini-3-pro",
        aspect_ratio: template.aspectRatio,
        is_template: true,
        template_id: template.id,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || `Failed to save scene to database: ${template.name}`)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🎨 Generating background scenes...")
  console.log(`Found ${BACKGROUND_SCENE_TEMPLATES.length} templates\n`)

  // Check if temp directory exists, create if not
  const tempDir = join(process.cwd(), "temp")
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true })
    console.log(`Created temp directory: ${tempDir}\n`)
  }

  // Get base URL from environment or use default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000"

  console.log(`Using API base URL: ${baseUrl}`)
  console.log("Note: Ensure Next.js dev server is running and you're authenticated.\n")

  const results: Array<{
    template: typeof BACKGROUND_SCENE_TEMPLATES[0]
    imageUrl: string
    tempPath: string
    storagePath: string
    success: boolean
    error?: string
  }> = []

  for (let i = 0; i < BACKGROUND_SCENE_TEMPLATES.length; i++) {
    const template = BACKGROUND_SCENE_TEMPLATES[i]
    try {
      console.log(`[${i + 1}/${BACKGROUND_SCENE_TEMPLATES.length}] Generating: ${template.name}...`)

      // Generate scene
      const { url: imageUrl } = await generateBackgroundScene(template, baseUrl)
      console.log(`  ✓ Generated: ${imageUrl}`)

      // Extract storage path from URL
      const urlParts = imageUrl.split("/kinkster-avatars/")
      const storagePath = urlParts.length > 1 ? urlParts[1] : `scenes/${template.id}_${Date.now()}.png`

      // Save to temp directory
      const tempPath = await saveImageToTemp(imageUrl, template.id)
      console.log(`  ✓ Saved to temp: ${tempPath}`)

      // Try to save to database (optional, may fail if not authenticated)
      try {
        await saveSceneToDatabase(template, imageUrl, storagePath, baseUrl)
        console.log(`  ✓ Saved to database`)
      } catch (dbError: any) {
        console.log(`  ⚠ Database save skipped: ${dbError.message}`)
      }

      console.log(`  ✅ Complete!\n`)

      results.push({
        template,
        imageUrl,
        tempPath,
        storagePath,
        success: true,
      })
    } catch (error: any) {
      console.error(`  ✗ Error generating ${template.name}:`, error.message)
      console.error(`    ${error.stack}\n`)
      results.push({
        template,
        imageUrl: "",
        tempPath: "",
        storagePath: "",
        success: false,
        error: error.message,
      })
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("✅ Generation complete!")
  console.log(`Successfully generated: ${results.filter((r) => r.success).length}/${BACKGROUND_SCENE_TEMPLATES.length} scenes`)
  console.log("=".repeat(60) + "\n")

  // Print summary
  if (results.some((r) => r.success)) {
    console.log("Generated Scenes:")
    results
      .filter((r) => r.success)
      .forEach(({ template, tempPath, imageUrl }) => {
        console.log(`  ✓ ${template.name}`)
        console.log(`    Temp: ${tempPath}`)
        console.log(`    URL: ${imageUrl}\n`)
      })
  }

  // Print errors
  const errors = results.filter((r) => !r.success)
  if (errors.length > 0) {
    console.log("Failed Scenes:")
    errors.forEach(({ template, error }) => {
      console.log(`  ✗ ${template.name}: ${error}\n`)
    })
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { main as generateBackgroundScenes }
