/**
 * Character Reference Image Utilities
 * 
 * Handles fetching and managing character reference images
 * for automatic inclusion in image generations.
 */

import { createClient } from "@/lib/supabase/server"

/**
 * Fetch reference images for character IDs
 * Returns up to 5 reference images (Gemini 3 Pro limit)
 */
export async function getCharacterReferenceImages(
  characterIds: string[]
): Promise<string[]> {
  if (!characterIds || characterIds.length === 0) {
    return []
  }

  const supabase = await createClient()

  // Fetch up to 5 characters (Gemini limit)
  const idsToFetch = characterIds.slice(0, 5)

  const { data: kinksters, error } = await supabase
    .from("kinksters")
    .select("id, reference_image_url")
    .in("id", idsToFetch)
    .not("reference_image_url", "is", null)

  if (error) {
    console.error("Failed to fetch character references:", error)
    return []
  }

  // Return reference image URLs, filtering out nulls
  return (kinksters || [])
    .map((k) => k.reference_image_url)
    .filter((url): url is string => url !== null && url !== undefined)
}

/**
 * Convert image URLs to base64 data URLs for Gemini API
 */
export async function convertUrlsToDataUrls(urls: string[]): Promise<string[]> {
  const dataUrlPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.warn(`Failed to fetch image from ${url}`)
        return null
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")
      const contentType = response.headers.get("content-type") || "image/jpeg"
      return `data:${contentType};base64,${base64}`
    } catch (error) {
      console.error(`Error converting URL to data URL: ${url}`, error)
      return null
    }
  })

  const dataUrls = await Promise.all(dataUrlPromises)
  return dataUrls.filter((url): url is string => url !== null)
}

/**
 * Get character reference images as data URLs ready for Gemini API
 */
export async function getCharacterReferenceDataUrls(
  characterIds: string[]
): Promise<string[]> {
  const referenceUrls = await getCharacterReferenceImages(characterIds)
  if (referenceUrls.length === 0) {
    return []
  }

  return await convertUrlsToDataUrls(referenceUrls)
}


